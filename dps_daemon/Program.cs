using System.Net;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using AionDpsMeter.Core.Models;
using AionDpsMeter.Services.Extensions;
using AionDpsMeter.Services.Models;
using AionDpsMeter.Services.PacketCapture;
using AionDpsMeter.Services.PacketProcessing;
using AionDpsMeter.Services.PacketProcessing.Routing;
using AionDpsMeter.Services.Services;
using AionDpsMeter.Services.Services.Entity;
using AionDpsMeter.Services.Services.Session;
using AionDpsMeter.Services.Services.Session.Persistence;
using AionDpsMeter.Services.Services.Settings;
using AionDpsMeter.Services.Services.Timed;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Aion2DpsDaemon
{
    public class Program
    {
        private static readonly List<WebSocket> ConnectedClients = new();
        private static readonly object ClientsLock = new();
        private static int _latestPingMs = 0;

        public static async Task Main(string[] args)
        {
            Console.OutputEncoding = Encoding.UTF8;
            Console.WriteLine("=================================================");
            Console.WriteLine("⚡ FEΔR Aion 2 DPS Core Daemon (Headless Microservice)");
            Console.WriteLine("=================================================");

            int port = 28888;
            if (args.Length > 0 && int.TryParse(args[0], out var customPort))
            {
                port = customPort;
            }

            // 1. Dependency Injection setup
            var services = new ServiceCollection();
            services.AddLogging(builder =>
            {
                builder.AddConsole();
                builder.SetMinimumLevel(LogLevel.Information);
            });

            services.AddCombatHistoryPersistence("combat-history.db");
            services.AddSingleton<IAppSettingsService, AppSettingsService>();
            services.AddSingleton<FilePacketWriter>();
            services.AddSingleton<TcpStreamBuffer>();
            services.AddSingleton<IPacketCaptureDevice, CaptureDevice>();
            services.AddSingleton<EntityTracker>();
            services.AddKeyedSingleton<ITimedEventTracker, BuffTimedEventTracker>("Buffs");
            services.AddKeyedSingleton<ITimedEventTracker, SkillCdTimedEventTracker>("SkillCd");
            services.AddSingleton<CombatSessionManager>();
            services.AddPacketProcessingRouting();
            services.AddSingleton<IPacketService, PacketPipelineService>();

            var serviceProvider = services.BuildServiceProvider();

            // 2. Resolve Core Services
            var sessionManager = serviceProvider.GetRequiredService<CombatSessionManager>();
            var pipelineService = (PacketPipelineService)serviceProvider.GetRequiredService<IPacketService>();

            sessionManager.PingUpdated += (s, ping) =>
            {
                _latestPingMs = ping;
            };

            // 3. Start Packet Capture
            try
            {
                Console.WriteLine("[INFO] Starting Npcap Packet Pipeline...");
                pipelineService.Start();
                Console.WriteLine("[INFO] Packet Pipeline active and capturing.");
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"[ERROR] Failed to start packet capture: {ex.Message}");
                Console.WriteLine("[HINT] Ensure Npcap is installed with WinPcap API compatibility and run with Administrator rights.");
                Console.ResetColor();
            }

            // 4. Start HTTP / WebSocket Listener
            var cts = new CancellationTokenSource();
            string prefix = $"http://127.0.0.1:{port}/";
            var httpListener = new HttpListener();
            httpListener.Prefixes.Add(prefix);

            try
            {
                httpListener.Start();
                Console.WriteLine($"[INFO] Microservice listening on {prefix} (WebSocket at {prefix}ws)");
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"[ERROR] Failed to bind HttpListener to {prefix}: {ex.Message}");
                Console.ResetColor();
                return;
            }

            // 5. Background broadcast loop
            _ = Task.Run(() => BroadcastLoopAsync(sessionManager, pipelineService, cts.Token));

            // 6. Handle HTTP/WS requests
            _ = Task.Run(async () =>
            {
                while (!cts.Token.IsCancellationRequested)
                {
                    try
                    {
                        var context = await httpListener.GetContextAsync();
                        if (context.Request.IsWebSocketRequest)
                        {
                            _ = ProcessWebSocketRequestAsync(context, sessionManager, pipelineService, cts.Token);
                        }
                        else
                        {
                            ProcessHttpRequest(context);
                        }
                    }
                    catch (HttpListenerException) when (cts.Token.IsCancellationRequested)
                    {
                        break;
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[WARN] Listener error: {ex.Message}");
                    }
                }
            });

            // 7. Wait for termination
            Console.WriteLine("[INFO] Daemon is running. Press Ctrl+C to terminate.");
            var exitEvent = new ManualResetEventSlim(false);
            Console.CancelKeyPress += (sender, e) =>
            {
                e.Cancel = true;
                exitEvent.Set();
            };

            exitEvent.Wait();

            Console.WriteLine("[INFO] Stopping Aion 2 DPS Core Daemon...");
            cts.Cancel();
            try
            {
                pipelineService.Stop();
                httpListener.Stop();
            }
            catch { }

            Console.WriteLine("[INFO] Daemon exited cleanly.");
        }

        private static void ProcessHttpRequest(HttpListenerContext context)
        {
            var req = context.Request;
            var resp = context.Response;

            // CORS headers
            resp.AddHeader("Access-Control-Allow-Origin", "*");
            resp.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            resp.AddHeader("Access-Control-Allow-Headers", "Content-Type");

            if (req.HttpMethod == "OPTIONS")
            {
                resp.StatusCode = 204;
                resp.Close();
                return;
            }

            if (req.Url?.AbsolutePath == "/status")
            {
                var payload = JsonSerializer.Serialize(new
                {
                    status = "ok",
                    service = "Aion2DpsCore",
                    version = "1.0.0",
                    ping = _latestPingMs,
                    clients = ConnectedClients.Count
                });

                byte[] buffer = Encoding.UTF8.GetBytes(payload);
                resp.ContentType = "application/json";
                resp.ContentLength64 = buffer.Length;
                resp.OutputStream.Write(buffer, 0, buffer.Length);
                resp.Close();
                return;
            }

            resp.StatusCode = 404;
            resp.Close();
        }

        private static async Task ProcessWebSocketRequestAsync(
            HttpListenerContext context,
            CombatSessionManager sessionManager,
            PacketPipelineService pipelineService,
            CancellationToken ct)
        {
            WebSocketContext wsContext;
            try
            {
                wsContext = await context.AcceptWebSocketAsync(null);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WARN] WebSocket upgrade failed: {ex.Message}");
                context.Response.StatusCode = 500;
                context.Response.Close();
                return;
            }

            var ws = wsContext.WebSocket;
            lock (ClientsLock)
            {
                ConnectedClients.Add(ws);
            }
            Console.WriteLine($"[INFO] New client connected. Total clients: {ConnectedClients.Count}");

            var buffer = new byte[4096];
            try
            {
                while (ws.State == WebSocketState.Open && !ct.IsCancellationRequested)
                {
                    var result = await ws.ReceiveAsync(new ArraySegment<byte>(buffer), ct);
                    if (result.MessageType == WebSocketMessageType.Close)
                    {
                        await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", CancellationToken.None);
                        break;
                    }

                    if (result.MessageType == WebSocketMessageType.Text)
                    {
                        var json = Encoding.UTF8.GetString(buffer, 0, result.Count);
                        HandleClientMessage(json, sessionManager, pipelineService, ws);
                    }
                }
            }
            catch (Exception)
            {
                // Disconnected
            }
            finally
            {
                lock (ClientsLock)
                {
                    ConnectedClients.Remove(ws);
                }
                ws.Dispose();
                Console.WriteLine($"[INFO] Client disconnected. Remaining: {ConnectedClients.Count}");
            }
        }

        private static void HandleClientMessage(string json, CombatSessionManager sessionManager, PacketPipelineService pipelineService, WebSocket ws)
        {
            try
            {
                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("action", out var actionElem))
                {
                    var action = actionElem.GetString();
                    if (action == "reset")
                    {
                        Console.WriteLine("[CMD] Resetting combat session...");
                        sessionManager.CompleteAndPersistActiveSessions();
                        pipelineService.Reset();
                    }
                }
            }
            catch { }
        }

        private static async Task BroadcastLoopAsync(CombatSessionManager sessionManager, PacketPipelineService pipelineService, CancellationToken ct)
        {
            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
            };

            while (!ct.IsCancellationRequested)
            {
                try
                {
                    await Task.Delay(250, ct);

                    WebSocket[] clients;
                    lock (ClientsLock)
                    {
                        if (ConnectedClients.Count == 0) continue;
                        clients = ConnectedClients.Where(c => c.State == WebSocketState.Open).ToArray();
                    }

                    if (clients.Length == 0) continue;

                    var duration = sessionManager.GetCombatDuration();
                    var durationFormatted = duration.ToString(@"mm\:ss");
                    var targetInfo = sessionManager.GetActiveTargetInfo();
                    var partyDps = sessionManager.GetPartyDps();

                    var stats = sessionManager.PlayerStats
                        .Where(s => s.IsIdentified || s.DamagePercentage > 0.5 || s.TotalDamage > 0)
                        .OrderByDescending(s => s.TotalDamage)
                        .ToList();

                    long topDamage = stats.Count > 0 ? stats[0].TotalDamage : 0;
                    long totalTeamDamage = stats.Sum(s => s.TotalDamage);

                    var playerDtos = stats.Select((s, index) => new
                    {
                        id = s.PlayerId,
                        rank = index + 1,
                        name = s.PlayerName,
                        className = s.ClassName,
                        classId = s.ClassId,
                        isUser = s.IsUser,
                        totalDamage = s.TotalDamage,
                        dps = (long)Math.Round(s.DamagePerSecond),
                        damagePct = Math.Round(s.DamagePercentage, 1),
                        critRate = Math.Round(s.CriticalRate, 1),
                        backRate = Math.Round(s.BackAttackRate, 1),
                        perfectRate = Math.Round(s.PerfectRate, 1),
                        deaths = s.PlayerDeaths,
                        relativePct = topDamage > 0 ? Math.Round(((double)s.TotalDamage / topDamage) * 100, 1) : 0
                    }).ToList();

                    var packet = new
                    {
                        connected = true,
                        ping = _latestPingMs,
                        timer = durationFormatted,
                        durationSec = (int)duration.TotalSeconds,
                        target = targetInfo is not null ? new
                        {
                            hasTarget = true,
                            name = targetInfo.Name,
                            isBoss = targetInfo.IsBoss,
                            hpCurrent = targetInfo.HpCurrent,
                            hpMax = targetInfo.HpTotal,
                            hpPercent = targetInfo.HpTotal > 0 ? Math.Round(((double)targetInfo.HpCurrent / targetInfo.HpTotal) * 100, 1) : 0
                        } : new
                        {
                            hasTarget = false,
                            name = "Không có mục tiêu",
                            isBoss = false,
                            hpCurrent = 0L,
                            hpMax = 0L,
                            hpPercent = 0.0
                        },
                        party = new
                        {
                            totalDamage = totalTeamDamage,
                            dps = (long)Math.Round(partyDps),
                            playerCount = stats.Count
                        },
                        players = playerDtos
                    };

                    var json = JsonSerializer.Serialize(packet, options);
                    var bytes = Encoding.UTF8.GetBytes(json);
                    var segment = new ArraySegment<byte>(bytes);

                    foreach (var client in clients)
                    {
                        if (client.State == WebSocketState.Open)
                        {
                            _ = client.SendAsync(segment, WebSocketMessageType.Text, true, CancellationToken.None);
                        }
                    }
                }
                catch (OperationCanceledException) { break; }
                catch (Exception ex)
                {
                    Console.WriteLine($"[WARN] Broadcast loop error: {ex.Message}");
                }
            }
        }
    }
}
