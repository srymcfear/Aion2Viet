using System;
using System.Buffers.Binary;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Blake3;
using K4os.Compression.LZ4;

namespace Aion2L10NTool;

class Program
{
    private static readonly byte[] ManifestHashKey =
    [
        0xeb, 0x0b, 0xc0, 0x97, 0x28, 0x47, 0x5a, 0xb5,
        0x19, 0x6a, 0xf8, 0xce, 0x78, 0x5d, 0x8a, 0x79,
        0xdf, 0x18, 0xd2, 0x14, 0x8f, 0x51, 0xcb, 0xef,
        0x8b, 0x39, 0xe4, 0x3b, 0x2a, 0x1d, 0x40, 0x56
    ];

    private const ulong HeaderXorConstant = 0xCD02190910CE83F6;
    private static readonly ulong HeaderKeyRoot = Blake3Hash(HeaderXorConstant);
    private const string PakAesKey = "0x06038EF544B6007614F8574F1B7C2A3F0D565F74CDCC1B366B4EA1A17B97CBFF";

    public static Dictionary<ulong, byte[]> AesKeys = new();

    private static readonly Dictionary<string, string> LocalePrefixes = new(StringComparer.OrdinalIgnoreCase)
    {
        ["en-US"] = "27F0BB573A5DC198B955B7658A7AC02017DEBA024323CD5FA2E0442CE9479CBE",
        ["ko-KR"] = "4346B96015E7D357A420B25511E19969C2473E3858BF6842E16DBC674FCFD4A9",
        ["ja-JP"] = "07A59BB32F6302E3B3DCC1623C69E2E838106441CEA6D596173623EE8BA7AFF4",
        ["de-DE"] = "23A69AB43437D576D1F7128D66F13D02651E7C363A88BF2680B097EE752D4B8C",
        ["fr-FR"] = "BB32F79B8A1B7B9354E5E924484F14ACDE464220C50ACA4F1D8DE26BE71CB2C5",
        ["zh-TW"] = "8761B29135765B211F263EDEF7ACBD70578F5236B0C6268A8320E046D3E3BB86"
    };

    static void Main(string[] args)
    {
        Console.OutputEncoding = Encoding.UTF8;
        string mode = args.FirstOrDefault(a => a != "--")?.ToLowerInvariant() ?? "unpack";
        string baseDir = @"H:\AION2_Code\trans";
        string manifestPath = Path.Combine(baseDir, "key_manifest.dat");

        if (!File.Exists(manifestPath))
        {
            Console.WriteLine($"Error: {manifestPath} not found!");
            return;
        }

        LoadKeyManifest(manifestPath);

        if (mode == "pack")
        {
            Console.WriteLine("=== REPACK MODE: Packing JSON back to .pak ===");
            RepackAll(baseDir);
        }
        else if (mode == "find-error")
        {
            FindErrorInExe();
        }
        else if (mode == "compare-decomp")
        {
            CompareDecomp(baseDir);
        }
        else if (mode == "inspect")
        {
            Inspect(baseDir);
        }
        else if (mode == "diff-template")
        {
            SyncTemplate(baseDir, dryRun: true);
        }
        else if (mode == "sync-template")
        {
            SyncTemplate(baseDir, dryRun: false);
        }
        else if (mode == "unpack")
        {
            string? target = args.Skip(1).FirstOrDefault(a => a != "--");
            Console.WriteLine($"=== UNPACK MODE: Extracting .pak to JSON/CSV {(target != null ? $"({target})" : "")} ===");
            UnpackAll(baseDir, target);
        }
        else
        {
            Console.WriteLine($"Unknown mode: {mode}");
        }
    }

    static (byte[] decompressed, byte[] prefix) DecryptL10NWithPrefix(byte[] dat, string locale)
    {
        using var ms = new MemoryStream(dat);
        using var br = new BinaryReader(ms);

        if (dat.Length < 0x14 || br.ReadInt32() != 2)
            throw new Exception("AION2 L10N container is invalid or not version 2");

        string blakeLocale = locale.Replace("official_", "");
        ulong seed = Blake3Hash($"L10NString_{blakeLocale}");

        byte[] headerBytes = br.ReadBytes(0x10);
        byte[] headerKey = DeriveHeaderKey(seed, 3);
        XorBytes(headerBytes, headerKey);

        int packedSize = BitConverter.ToInt32(headerBytes, 0);
        int encType = BitConverter.ToInt32(headerBytes, 4);
        int alignedSize = BitConverter.ToInt32(headerBytes, 8);
        int rawSize = BitConverter.ToInt32(headerBytes, 12);

        if (encType != 2)
            throw new Exception($"Unsupported encryption type {encType}");

        if (!AesKeys.TryGetValue(seed, out var aesKey))
            throw new Exception($"AES key for seed {seed:X16} (L10NString_{locale}) not found in manifest!");

        byte[] encryptedPayload = br.ReadBytes(alignedSize);
        byte[] decryptedPayload = AesDecryptEcb(encryptedPayload, aesKey);

        byte[] prefix = decryptedPayload.AsSpan(0, 0x20).ToArray();

        byte[] output = new byte[rawSize];
        int written = LZ4Codec.Decode(decryptedPayload, 0x20, packedSize, output, 0, rawSize);

        if (written != rawSize)
            throw new Exception($"LZ4 decode failed ({written}/{rawSize})");

        return (output, prefix);
    }

    static byte[] BuildL10NDatWithPrefix(Dictionary<string, string> entries, string locale, byte[] prefix)
    {
        using var ms = new MemoryStream();
        using var bw = new BinaryWriter(ms);

        bw.Write((int)1); // tableVer = 1
        WriteFString(bw, "AION2");
        bw.Write((int)entries.Count);

        foreach (var kvp in entries)
        {
            WriteFString(bw, kvp.Key);
            WriteFString(bw, kvp.Value);
        }
        bw.Write((int)0); // Required table terminator (4 bytes)

        byte[] rawPayload = ms.ToArray();
        int rawSize = rawPayload.Length;

        int maxPacked = LZ4Codec.MaximumOutputSize(rawSize);
        byte[] packedBuf = new byte[maxPacked];
        int packedSize = LZ4Codec.Encode(rawPayload, 0, rawSize, packedBuf, 0, maxPacked, LZ4Level.L12_MAX);

        int payloadTotal = 0x20 + packedSize;
        int alignedSize = (payloadTotal + 15) & ~15;
        byte[] aesBuffer = new byte[alignedSize];
        Array.Copy(prefix, 0, aesBuffer, 0, 0x20);
        Array.Copy(packedBuf, 0, aesBuffer, 0x20, packedSize);

        ulong seed = Blake3Hash($"L10NString_{locale}");
        if (!AesKeys.TryGetValue(seed, out var aesKey))
            throw new Exception($"AES key for seed {seed:X16} (L10NString_{locale}) not found!");

        byte[] encryptedPayload = AesEncryptEcb(aesBuffer, aesKey);

        byte[] header = new byte[16];
        BinaryPrimitives.WriteInt32LittleEndian(header.AsSpan(0, 4), packedSize);
        BinaryPrimitives.WriteInt32LittleEndian(header.AsSpan(4, 4), 2); // EEncryptionType.CompressedAES
        BinaryPrimitives.WriteInt32LittleEndian(header.AsSpan(8, 4), alignedSize);
        BinaryPrimitives.WriteInt32LittleEndian(header.AsSpan(12, 4), rawSize);

        byte[] headerKey = DeriveHeaderKey(seed, 3);
        XorBytes(header, headerKey);

        using var outMs = new MemoryStream();
        using var outBw = new BinaryWriter(outMs);
        outBw.Write((int)2);
        outBw.Write(header);
        outBw.Write(encryptedPayload);

        return outMs.ToArray();
    }

    static void SyncTemplate(string baseDir, bool dryRun)
    {
        string templateRoot = @"H:\AION2_Code\aion2wwpurple-translate\Aion2\Content\L10N\Text";
        if (!Directory.Exists(templateRoot))
        {
            Console.WriteLine($"Template folder not found: {templateRoot}");
            return;
        }

        string scratchDir = Path.Combine(baseDir, "scratch", "template_extracted");
        Directory.CreateDirectory(scratchDir);

        // 1. Load User's translations
        string userEnJsonPath = Path.Combine(baseDir, "en-US_strings.json");
        string userKoJsonPath = Path.Combine(baseDir, "ko-KR_strings.json");
        var userEnEntries = JsonSerializer.Deserialize<Dictionary<string, string>>(File.ReadAllText(userEnJsonPath, Encoding.UTF8))!;
        var userKoEntries = File.Exists(userKoJsonPath) 
            ? JsonSerializer.Deserialize<Dictionary<string, string>>(File.ReadAllText(userKoJsonPath, Encoding.UTF8))!
            : userEnEntries;

        Console.WriteLine($"Loaded User translations: en-US ({userEnEntries.Count:N0} keys), ko-KR ({userKoEntries.Count:N0} keys)");

        string[] dirs = Directory.GetDirectories(templateRoot);
        var allMissingInUser = new Dictionary<string, Dictionary<string, string>>();

        foreach (var dir in dirs)
        {
            string locale = Path.GetFileName(dir);
            var datFiles = Directory.GetFiles(dir, "L10NString.dat*");
            if (datFiles.Length == 0) continue;

            string oldDatPath = datFiles[0];
            string oldFileName = Path.GetFileName(oldDatPath);
            Console.WriteLine($"\n=======================================================");
            Console.WriteLine($"Processing locale: {locale} (Current file: {oldFileName})");

            byte[] oldRaw = File.ReadAllBytes(oldDatPath);
            var (decompressed, prefix) = DecryptL10NWithPrefix(oldRaw, locale);

            using var ms = new MemoryStream(decompressed);
            using var br = new BinaryReader(ms);
            int tableVer = br.ReadInt32();
            string ns = ReadFString(br);
            int count = br.ReadInt32();

            var templateEntries = new Dictionary<string, string>(count, StringComparer.Ordinal);
            for (int i = 0; i < count; i++)
            {
                string k = ReadFString(br);
                string v = ReadFString(br);
                templateEntries[k] = v;
            }

            // Save extracted template to scratch
            string templateJsonPath = Path.Combine(scratchDir, $"{locale}_template.json");
            File.WriteAllText(templateJsonPath, JsonSerializer.Serialize(templateEntries, new JsonSerializerOptions { WriteIndented = true, Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping }));

            // Choose user dict (ko-KR uses userKoEntries, others use userEnEntries)
            var userDict = locale == "ko-KR" ? userKoEntries : userEnEntries;

            var newEntries = new Dictionary<string, string>(templateEntries.Count, StringComparer.Ordinal);
            var missingForThisLocale = new Dictionary<string, string>();

            int replacedCount = 0;
            int missingCount = 0;

            foreach (var kvp in templateEntries)
            {
                if (userDict.TryGetValue(kvp.Key, out var userVal))
                {
                    newEntries[kvp.Key] = userVal;
                    replacedCount++;
                }
                else
                {
                    // Fallback to template's value
                    newEntries[kvp.Key] = kvp.Value;
                    missingForThisLocale[kvp.Key] = kvp.Value;
                    missingCount++;
                }
            }

            Console.WriteLine($"Template total keys: {templateEntries.Count:N0}");
            Console.WriteLine($"Replaced from User Translation: {replacedCount:N0}");
            Console.WriteLine($"Missing in User Translation: {missingCount:N0}");

            if (missingCount > 0)
            {
                allMissingInUser[locale] = missingForThisLocale;
                Console.WriteLine($"Sample missing keys (first 5):");
                int shown = 0;
                foreach (var mk in missingForThisLocale)
                {
                    Console.WriteLine($"  {mk.Key} => {mk.Value}");
                    if (++shown >= 5) break;
                }
            }

            if (!dryRun)
            {
                byte[] newDat = BuildL10NDatWithPrefix(newEntries, locale, prefix);
                string newMd5 = Convert.ToHexString(MD5.HashData(newDat)).ToLowerInvariant();
                string newFileName = $"L10NString.dat.{newMd5}";
                string newDatPath = Path.Combine(dir, newFileName);

                File.WriteAllBytes(newDatPath, newDat);
                Console.WriteLine($"CREATED: {newDatPath} (MD5: {newMd5})");

                if (!string.Equals(oldFileName, newFileName, StringComparison.OrdinalIgnoreCase))
                {
                    File.Delete(oldDatPath);
                    Console.WriteLine($"DELETED old file: {oldFileName}");
                }
            }
        }

        // Save report of missing keys
        string reportPath = Path.Combine(baseDir, "scratch", "missing_keys_report.json");
        File.WriteAllText(reportPath, JsonSerializer.Serialize(allMissingInUser, new JsonSerializerOptions { WriteIndented = true, Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping }));
        Console.WriteLine($"\n=======================================================");
        Console.WriteLine($"Report of missing keys saved to: {reportPath}");
    }

    static void CompareDecomp(string baseDir)
    {
        string officialDat = Path.Combine(baseDir, "official_en-US_L10NString.dat");
        byte[] rawDat = File.ReadAllBytes(officialDat);
        byte[] decompressedOfficial = DecryptL10N(rawDat, "official_en-US");

        string officialJson = Path.Combine(baseDir, "official_en-US_strings.json");
        string jsonContent = File.ReadAllText(officialJson, Encoding.UTF8);
        var entries = JsonSerializer.Deserialize<Dictionary<string, string>>(jsonContent)!;

        using var ms = new MemoryStream();
        using var bw = new BinaryWriter(ms);
        bw.Write((int)1);
        WriteFString(bw, "AION2");
        bw.Write((int)entries.Count);
        foreach (var kvp in entries)
        {
            WriteFString(bw, kvp.Key);
            WriteFString(bw, kvp.Value);
        }
        bw.Write((int)0);
        byte[] ourPayload = ms.ToArray();

        Console.WriteLine($"en-US decompressed size: {decompressedOfficial.Length:N0}");
        Console.WriteLine($"Our generated payload size: {ourPayload.Length:N0}");

        if (decompressedOfficial.Length != ourPayload.Length)
        {
            Console.WriteLine($"LENGTH MISMATCH! Official has {decompressedOfficial.Length - ourPayload.Length} extra bytes at the end!");
            int extraStart = Math.Min(decompressedOfficial.Length, ourPayload.Length);
            byte[] extraBytes = decompressedOfficial.AsSpan(extraStart).ToArray();
            Console.WriteLine($"Extra bytes (hex): {Convert.ToHexString(extraBytes)}");
            Console.WriteLine($"As Int32: {BitConverter.ToInt32(extraBytes, 0)}");
        }

        int diffCount = 0;
        int minLen = Math.Min(decompressedOfficial.Length, ourPayload.Length);
        for (int i = 0; i < minLen; i++)
        {
            if (decompressedOfficial[i] != ourPayload[i])
            {
                if (diffCount < 10)
                {
                    Console.WriteLine($"Diff at byte {i:X8}: Official={decompressedOfficial[i]:X2}, Ours={ourPayload[i]:X2}");
                }
                diffCount++;
            }
        }
        Console.WriteLine($"Total byte differences: {diffCount}");

        // Now test BuildL10NDat on official entries
        Console.WriteLine("\nTesting BuildL10NDat on official entries...");
        byte[] rebuiltDat = BuildL10NDat(entries, "en-US");
        Console.WriteLine($"Rebuilt dat size: {rebuiltDat.Length:N0} vs Official dat size: {rawDat.Length:N0}");
        try
        {
            byte[] decompRebuilt = DecryptL10N(rebuiltDat, "en-US");
            Console.WriteLine($"DecryptL10N on rebuilt dat SUCCESS! Length: {decompRebuilt.Length:N0}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"DecryptL10N on rebuilt dat FAILED: {ex.Message}");
        }
    }

    static void FindErrorInExe()
    {
        string exePath = @"F:\NCSoft\AION2_TW\Aion2\Binaries\Win64\Aion2.exe";
        Console.WriteLine($"Reading {exePath}...");
        byte[] exeBytes = File.ReadAllBytes(exePath);

        string[] targets = [
            "L10NText.cpp",
            "LoadBinary",
            "deserialization error",
            "ECB_LZ4"
        ];

        foreach (var t in targets)
        {
            byte[] u8 = Encoding.UTF8.GetBytes(t);
            byte[] u16 = Encoding.Unicode.GetBytes(t);

            int idx8 = exeBytes.AsSpan().IndexOf(u8);
            int idx16 = exeBytes.AsSpan().IndexOf(u16);

            Console.WriteLine($"Target '{t}': UTF8={idx8:X8}, UTF16={idx16:X8}");
            if (idx16 != -1)
            {
                int start = Math.Max(0, idx16 - 100);
                int end = Math.Min(exeBytes.Length, idx16 + 200);
                Console.WriteLine($"  Context UTF16: {Encoding.Unicode.GetString(exeBytes.AsSpan(start, end - start))}");
            }
            if (idx8 != -1)
            {
                int start = Math.Max(0, idx8 - 100);
                int end = Math.Min(exeBytes.Length, idx8 + 200);
                Console.WriteLine($"  Context UTF8: {Encoding.UTF8.GetString(exeBytes.AsSpan(start, end - start))}");
            }
        }
    }

    static void Inspect(string baseDir)
    {
        string[] targets = ["scratch/test_deployed_en/AION2/Content/L10N/Text/en-US/L10NString.dat", "official_en-US"];
        foreach (var loc in targets)
        {
            string p = loc.EndsWith(".dat") ? Path.Combine(baseDir, loc) : Path.Combine(baseDir, $"{loc}_L10NString.dat");
            string locName = loc.Contains("ko-KR") ? "ko-KR" : loc.Contains("ja-JP") ? "ja-JP" : loc.Contains("de-DE") ? "de-DE" : loc.Contains("fr-FR") ? "fr-FR" : "en-US";
            if (File.Exists(p))
            {
                Console.WriteLine($"\n--- {loc} ({locName}) ---");
                InspectSingle(p, locName);
            }
        }
    }

    static void InspectSingle(string datPath, string locale)
    {
        byte[] dat = File.ReadAllBytes(datPath);
        using var ms = new MemoryStream(dat);
        using var br = new BinaryReader(ms);

        int version = br.ReadInt32();
        byte[] headerBytes = br.ReadBytes(0x10);

        string blakeLocale = locale.Replace("official_", "");
        ulong seed = Blake3Hash($"L10NString_{blakeLocale}");
        byte[] headerKey = DeriveHeaderKey(seed, 3);
        byte[] decryptedHeader = (byte[])headerBytes.Clone();
        XorBytes(decryptedHeader, headerKey);

        int packedSize = BitConverter.ToInt32(decryptedHeader, 0);
        int encType = BitConverter.ToInt32(decryptedHeader, 4);
        int alignedSize = BitConverter.ToInt32(decryptedHeader, 8);
        int rawSize = BitConverter.ToInt32(decryptedHeader, 12);

        Console.WriteLine($"Version: {version}");
        Console.WriteLine($"Header: packedSize={packedSize}, encType={encType}, alignedSize={alignedSize}, rawSize={rawSize}");

        AesKeys.TryGetValue(seed, out var aesKey);
        byte[] encryptedPayload = br.ReadBytes(alignedSize);
        byte[] decryptedPayload = AesDecryptEcb(encryptedPayload, aesKey!);

        Console.WriteLine("Decrypted payload first 48 bytes (hex):");
        Console.WriteLine(Convert.ToHexString(decryptedPayload.AsSpan(0, Math.Min(48, decryptedPayload.Length))));

        Console.WriteLine("Decrypted payload at offset 0x20 first 32 bytes (hex):");
        Console.WriteLine(Convert.ToHexString(decryptedPayload.AsSpan(0x20, Math.Min(32, decryptedPayload.Length - 0x20))));

        byte[] output = new byte[rawSize];
        int written = LZ4Codec.Decode(decryptedPayload, 0x20, packedSize, output, 0, rawSize);
        Console.WriteLine($"LZ4 Decompress test: written={written} (expected={rawSize})");

        byte[] expectedHash = decryptedPayload.AsSpan(0, 0x20).ToArray();
        string expectedHex = Convert.ToHexString(expectedHash);
        Console.WriteLine($"Target prefix 32 bytes (hex): {expectedHex}");

        byte[] lz4Data = decryptedPayload.AsSpan(0x20, packedSize).ToArray();

        // 1. SHA256 of LZ4 data
        byte[] sha256Lz4 = SHA256.HashData(lz4Data);
        Console.WriteLine($"SHA256(LZ4): {Convert.ToHexString(sha256Lz4)} (Match: {Convert.ToHexString(sha256Lz4) == expectedHex})");

        // 2. SHA256 of Raw decompressed data
        byte[] sha256Raw = SHA256.HashData(output);
        Console.WriteLine($"SHA256(Raw): {Convert.ToHexString(sha256Raw)} (Match: {Convert.ToHexString(sha256Raw) == expectedHex})");

        // 3. Blake3 of LZ4 data
        using (var b3 = Hasher.New())
        {
            b3.Update(lz4Data);
            byte[] b3Lz4 = b3.Finalize().AsSpan().ToArray();
            Console.WriteLine($"Blake3(LZ4): {Convert.ToHexString(b3Lz4)} (Match: {Convert.ToHexString(b3Lz4) == expectedHex})");
        }

        // 4. Blake3 of Raw decompressed data
        using (var b3 = Hasher.New())
        {
            b3.Update(output);
            byte[] b3Raw = b3.Finalize().AsSpan().ToArray();
            Console.WriteLine($"Blake3(Raw): {Convert.ToHexString(b3Raw)} (Match: {Convert.ToHexString(b3Raw) == expectedHex})");
        }

        // 5. Blake3 keyed?
        using (var b3 = Hasher.NewKeyed(ManifestHashKey))
        {
            b3.Update(lz4Data);
            byte[] b3KeyedLz4 = b3.Finalize().AsSpan().ToArray();
            Console.WriteLine($"Blake3Keyed(LZ4): {Convert.ToHexString(b3KeyedLz4)} (Match: {Convert.ToHexString(b3KeyedLz4) == expectedHex})");
        }
        using (var b3 = Hasher.NewKeyed(ManifestHashKey))
        {
            b3.Update(output);
            byte[] b3KeyedRaw = b3.Finalize().AsSpan().ToArray();
            Console.WriteLine($"Blake3Keyed(Raw): {Convert.ToHexString(b3KeyedRaw)} (Match: {Convert.ToHexString(b3KeyedRaw) == expectedHex})");
        }

        using (var b3 = Hasher.NewKeyed(aesKey!))
        {
            b3.Update(lz4Data);
            byte[] b3AesLz4 = b3.Finalize().AsSpan().ToArray();
            Console.WriteLine($"Blake3KeyedAes(LZ4): {Convert.ToHexString(b3AesLz4)} (Match: {Convert.ToHexString(b3AesLz4) == expectedHex})");
        }
        using (var b3 = Hasher.NewKeyed(aesKey!))
        {
            b3.Update(output);
            byte[] b3AesRaw = b3.Finalize().AsSpan().ToArray();
            Console.WriteLine($"Blake3KeyedAes(Raw): {Convert.ToHexString(b3AesRaw)} (Match: {Convert.ToHexString(b3AesRaw) == expectedHex})");
        }

        // Inspect decompressed first 32 bytes
        Console.WriteLine("Decompressed first 32 bytes (hex):");
        Console.WriteLine(Convert.ToHexString(output.AsSpan(0, Math.Min(32, output.Length))));
        using var dms = new MemoryStream(output);
        using var dbr = new BinaryReader(dms);
        int tableVer = dbr.ReadInt32();
        string ns = ReadFString(dbr);
        int mapCount = dbr.ReadInt32();
        Console.WriteLine($"Table: tableVer={tableVer}, ns='{ns}', mapCount={mapCount}");
    }

    static void UnpackAll(string baseDir, string? targetLocale = null)
    {
        string[] targets = string.IsNullOrEmpty(targetLocale) 
            ? ["en-US", "ko-KR", "zh-TW", "official_en-US"] 
            : [targetLocale];

        foreach (var locale in targets)
        {
            string datFile = Path.Combine(baseDir, $"{locale}_L10NString.dat");
            if (!File.Exists(datFile))
            {
                Console.WriteLine($"Skipping {locale} (file not found: {datFile})");
                continue;
            }

            Console.WriteLine($"\nProcessing {locale} ({datFile})...");
            try
            {
                byte[] raw = File.ReadAllBytes(datFile);
                byte[] decompressed = DecryptL10N(raw, locale);

                using var ms = new MemoryStream(decompressed);
                using var br = new BinaryReader(ms);

                int tableVer = br.ReadInt32();
                string ns = ReadFString(br);
                int mapCount = br.ReadInt32();

                var entries = new Dictionary<string, string>(mapCount, StringComparer.Ordinal);
                for (int i = 0; i < mapCount; i++)
                {
                    string k = ReadFString(br);
                    string v = ReadFString(br);
                    entries[k] = v;
                }

                Console.WriteLine($"Extracted {entries.Count:N0} strings for {locale}!");

                // Save JSON
                string jsonPath = Path.Combine(baseDir, $"{locale}_strings.json");
                var options = new JsonSerializerOptions
                {
                    WriteIndented = true,
                    Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
                };
                File.WriteAllText(jsonPath, JsonSerializer.Serialize(entries, options), new UTF8Encoding(false));
                Console.WriteLine($"Saved JSON: {jsonPath}");

                // Save CSV
                string csvPath = Path.Combine(baseDir, $"{locale}_strings.csv");
                using (var sw = new StreamWriter(csvPath, false, new UTF8Encoding(true)))
                {
                    sw.WriteLine("Key,Value");
                    foreach (var kvp in entries)
                    {
                        sw.WriteLine($"{EscapeCsv(kvp.Key)},{EscapeCsv(kvp.Value)}");
                    }
                }
                Console.WriteLine($"Saved CSV: {csvPath}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error processing {locale}: {ex.Message}");
            }
        }
    }

    static void RepackAll(string baseDir)
    {
        string stagingDir = Path.Combine(baseDir, "staging");
        if (Directory.Exists(stagingDir)) Directory.Delete(stagingDir, true);

        string[] targets = ["en-US", "ko-KR", "zh-TW"];

        foreach (var locale in targets)
        {
            string jsonPath = Path.Combine(baseDir, $"{locale}_strings.json");
            if (!File.Exists(jsonPath))
            {
                // Fallback to en-US if other language JSON is missing
                jsonPath = Path.Combine(baseDir, "en-US_strings.json");
            }

            Console.WriteLine($"\nPacking {locale} using {Path.GetFileName(jsonPath)}...");
            string jsonContent = File.ReadAllText(jsonPath, Encoding.UTF8);
            var entries = JsonSerializer.Deserialize<Dictionary<string, string>>(jsonContent)
                ?? throw new Exception($"Failed to parse {jsonPath}");

            byte[] l10nDat = BuildL10NDat(entries, locale);

            string outFolder = Path.Combine(stagingDir, "AION2", "Content", "L10N", "Text", locale);
            Directory.CreateDirectory(outFolder);
            string outDat = Path.Combine(outFolder, "L10NString.dat");
            File.WriteAllBytes(outDat, l10nDat);
            Console.WriteLine($"Built {outDat} ({l10nDat.Length:N0} bytes)");
        }

        string repakExe = Path.Combine(baseDir, "repak_bin", "repak.exe");

        // 1. Build and pack en-US for Global (chunk 502000)
        string stagingEn = Path.Combine(stagingDir, "en-US");
        Directory.CreateDirectory(stagingEn);
        string jsonEn = Path.Combine(baseDir, "en-US_strings.json");
        var entriesEn = JsonSerializer.Deserialize<Dictionary<string, string>>(File.ReadAllText(jsonEn, Encoding.UTF8))!;
        byte[] datEn = BuildL10NDat(entriesEn, "en-US");
        File.WriteAllBytes(Path.Combine(stagingEn, "L10NString.dat"), datEn);

        string finalPakEn = Path.Combine(baseDir, "pakchunk502000-Windows_999_P.pak");
        Console.WriteLine($"\nPacking en-US into {finalPakEn} (Mount: ../../../Aion2/Content/L10N/Text/en-US/, Seed: 0xDEBC0EDF)...");
        RunRepak(repakExe, $"-a \"{PakAesKey}\" pack --version V11 --mount-point \"../../../Aion2/Content/L10N/Text/en-US/\" -p 3736866527 \"{stagingEn}\" \"{finalPakEn}\"");

        // 2. Build and pack ko-KR for Global (chunk 501000)
        string stagingKo = Path.Combine(stagingDir, "ko-KR");
        Directory.CreateDirectory(stagingKo);
        string jsonKo = File.Exists(Path.Combine(baseDir, "ko-KR_strings.json")) 
            ? Path.Combine(baseDir, "ko-KR_strings.json") 
            : jsonEn;
        var entriesKo = JsonSerializer.Deserialize<Dictionary<string, string>>(File.ReadAllText(jsonKo, Encoding.UTF8))!;
        byte[] datKo = BuildL10NDat(entriesKo, "ko-KR");
        File.WriteAllBytes(Path.Combine(stagingKo, "L10NString.dat"), datKo);

        string finalPakKo = Path.Combine(baseDir, "pakchunk501000-Windows_999_P.pak");
        Console.WriteLine($"\nPacking ko-KR into {finalPakKo} (Mount: ../../../Aion2/Content/L10N/Text/ko-KR/, Seed: 0xFAD4A6E0)...");
        RunRepak(repakExe, $"-a \"{PakAesKey}\" pack --version V11 --mount-point \"../../../Aion2/Content/L10N/Text/ko-KR/\" -p 4208240352 \"{stagingKo}\" \"{finalPakKo}\"");

        // 3. Build legacy/universal pak with full virtual tree for TW / root mods (AION2 all caps)
        string stagingTree = Path.Combine(stagingDir, "tree", "AION2", "Content", "L10N", "Text");
        Directory.CreateDirectory(Path.Combine(stagingTree, "en-US"));
        Directory.CreateDirectory(Path.Combine(stagingTree, "ko-KR"));
        Directory.CreateDirectory(Path.Combine(stagingTree, "zh-TW"));
        File.Copy(Path.Combine(stagingEn, "L10NString.dat"), Path.Combine(stagingTree, "en-US", "L10NString.dat"), true);
        File.Copy(Path.Combine(stagingKo, "L10NString.dat"), Path.Combine(stagingTree, "ko-KR", "L10NString.dat"), true);
        File.Copy(Path.Combine(stagingEn, "L10NString.dat"), Path.Combine(stagingTree, "zh-TW", "L10NString.dat"), true);

        string finalPakUniversal = Path.Combine(baseDir, "pakchunk502000-Windows_999_P_universal.pak");
        Console.WriteLine($"\nPacking universal tree into {finalPakUniversal}...");
        RunRepak(repakExe, $"-a \"{PakAesKey}\" pack --version V11 --mount-point \"../../../\" \"{Path.Combine(stagingDir, "tree")}\" \"{finalPakUniversal}\"");
    }

    static void RunRepak(string repakExe, string arguments)
    {
        var psi = new ProcessStartInfo
        {
            FileName = repakExe,
            Arguments = arguments,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false
        };

        using var proc = Process.Start(psi)!;
        string stdout = proc.StandardOutput.ReadToEnd();
        string stderr = proc.StandardError.ReadToEnd();
        proc.WaitForExit();

        if (proc.ExitCode == 0)
        {
            Console.WriteLine("SUCCESS! PAK created successfully.");
        }
        else
        {
            Console.WriteLine($"Repak error (exit {proc.ExitCode}):\n{stderr}\n{stdout}");
        }
    }

    static byte[] BuildL10NDat(Dictionary<string, string> entries, string locale)
    {
        // 1. Build raw decompressed payload
        using var ms = new MemoryStream();
        using var bw = new BinaryWriter(ms);

        bw.Write((int)1); // tableVer = 1
        WriteFString(bw, "AION2");
        bw.Write((int)entries.Count);

        foreach (var kvp in entries)
        {
            WriteFString(bw, kvp.Key);
            WriteFString(bw, kvp.Value);
        }
        bw.Write((int)0); // Required table terminator (4 bytes)

        byte[] rawPayload = ms.ToArray();
        int rawSize = rawPayload.Length;

        // 2. LZ4 Compress payload
        int maxPacked = LZ4Codec.MaximumOutputSize(rawSize);
        byte[] packedBuf = new byte[maxPacked];
        int packedSize = LZ4Codec.Encode(rawPayload, 0, rawSize, packedBuf, 0, maxPacked, LZ4Level.L12_MAX);

        // Aligned to 16 bytes for AES, prepended with 0x20 bytes padding as expected by Aion2
        int payloadTotal = 0x20 + packedSize;
        int alignedSize = (payloadTotal + 15) & ~15;
        byte[] aesBuffer = new byte[alignedSize];
        string prefixHex = LocalePrefixes.TryGetValue(locale, out var p) ? p : LocalePrefixes["en-US"];
        byte[] prefix = Convert.FromHexString(prefixHex);
        Array.Copy(prefix, 0, aesBuffer, 0, 0x20);
        Array.Copy(packedBuf, 0, aesBuffer, 0x20, packedSize);

        // 3. AES Encrypt payload
        ulong seed = Blake3Hash($"L10NString_{locale}");
        if (!AesKeys.TryGetValue(seed, out var aesKey))
            throw new Exception($"AES key for seed {seed:X16} (L10NString_{locale}) not found!");

        byte[] encryptedPayload = AesEncryptEcb(aesBuffer, aesKey);

        // 4. Build FL10NHeader (16 bytes)
        byte[] header = new byte[16];
        BinaryPrimitives.WriteInt32LittleEndian(header.AsSpan(0, 4), packedSize);
        BinaryPrimitives.WriteInt32LittleEndian(header.AsSpan(4, 4), 2); // EEncryptionType.CompressedAES
        BinaryPrimitives.WriteInt32LittleEndian(header.AsSpan(8, 4), alignedSize);
        BinaryPrimitives.WriteInt32LittleEndian(header.AsSpan(12, 4), rawSize);

        byte[] headerKey = DeriveHeaderKey(seed, 3); // 3 = Localization
        XorBytes(header, headerKey);

        // 5. Assemble final .dat file
        using var outMs = new MemoryStream();
        using var outBw = new BinaryWriter(outMs);
        outBw.Write((int)2); // container version = 2
        outBw.Write(header);
        outBw.Write(encryptedPayload);

        return outMs.ToArray();
    }

    static void WriteFString(BinaryWriter bw, string s)
    {
        if (string.IsNullOrEmpty(s))
        {
            bw.Write((int)0);
            return;
        }

        bool isAscii = true;
        for (int i = 0; i < s.Length; i++)
        {
            if (s[i] > 127) { isAscii = false; break; }
        }

        if (isAscii)
        {
            byte[] bytes = Encoding.UTF8.GetBytes(s);
            bw.Write((int)(bytes.Length + 1));
            bw.Write(bytes);
            bw.Write((byte)0); // null terminator
        }
        else
        {
            byte[] bytes = Encoding.Unicode.GetBytes(s);
            int charCount = s.Length + 1;
            bw.Write((int)(-charCount));
            bw.Write(bytes);
            bw.Write((ushort)0); // null terminator (2 bytes)
        }
    }

    static string ReadFString(BinaryReader br)
    {
        int length = br.ReadInt32();
        if (length == 0) return string.Empty;

        if (length > 0)
        {
            byte[] bytes = br.ReadBytes(length);
            return Encoding.UTF8.GetString(bytes, 0, length - 1);
        }
        else
        {
            int charCount = -length;
            int byteCount = charCount * 2;
            byte[] bytes = br.ReadBytes(byteCount);
            return Encoding.Unicode.GetString(bytes, 0, byteCount - 2);
        }
    }

    static void LoadKeyManifest(string path)
    {
        byte[] data = File.ReadAllBytes(path);
        const int payloadOffset = 8;
        int count = (data.Length - payloadOffset) / 0x30;

        using var hasher = Hasher.New();
        hasher.Update(ManifestHashKey);
        byte[] manifestKey = hasher.Finalize().AsSpan().ToArray();

        byte[] payload = new byte[count * 0x30];
        Array.Copy(data, payloadOffset, payload, 0, payload.Length);

        byte[] decrypted = AesDecryptEcb(payload, manifestKey);

        using var ms = new MemoryStream(decrypted);
        using var br = new BinaryReader(ms);

        for (int i = 0; i < count; i++)
        {
            ulong seed = br.ReadUInt64();
            byte[] k = br.ReadBytes(32);
            br.BaseStream.Position += 8;
            AesKeys[seed] = k;
        }
    }

    static byte[] DecryptL10N(byte[] dat, string locale)
    {
        using var ms = new MemoryStream(dat);
        using var br = new BinaryReader(ms);

        if (dat.Length < 0x14 || br.ReadInt32() != 2)
            throw new Exception("AION2 L10N container is invalid or not version 2");

        string blakeLocale = locale.Replace("official_", "");
        ulong seed = Blake3Hash($"L10NString_{blakeLocale}");

        byte[] headerBytes = br.ReadBytes(0x10);
        byte[] headerKey = DeriveHeaderKey(seed, 3);
        XorBytes(headerBytes, headerKey);

        int packedSize = BitConverter.ToInt32(headerBytes, 0);
        int encType = BitConverter.ToInt32(headerBytes, 4);
        int alignedSize = BitConverter.ToInt32(headerBytes, 8);
        int rawSize = BitConverter.ToInt32(headerBytes, 12);

        if (encType != 2)
            throw new Exception($"Unsupported encryption type {encType}");

        if (!AesKeys.TryGetValue(seed, out var aesKey))
            throw new Exception($"AES key for seed {seed:X16} (L10NString_{locale}) not found in manifest!");

        byte[] encryptedPayload = br.ReadBytes(alignedSize);
        byte[] decryptedPayload = AesDecryptEcb(encryptedPayload, aesKey);

        byte[] output = new byte[rawSize];
        int written = LZ4Codec.Decode(decryptedPayload, 0x20, packedSize, output, 0, rawSize);

        if (written != rawSize)
            throw new Exception($"LZ4 decode failed ({written}/{rawSize})");

        return output;
    }

    static byte[] DeriveHeaderKey(ulong seed, int type)
    {
        byte[] input = new byte[24];
        BinaryPrimitives.WriteUInt64LittleEndian(input.AsSpan(0, 8), HeaderKeyRoot);
        BinaryPrimitives.WriteUInt64LittleEndian(input.AsSpan(8, 8), seed);
        BinaryPrimitives.WriteInt32LittleEndian(input.AsSpan(16, 4), type);

        using var hasher = Hasher.New();
        hasher.Update(input);
        return hasher.Finalize().AsSpan().ToArray();
    }

    static ulong Blake3Hash(string value)
    {
        using var hasher = Hasher.New();
        hasher.Update(Encoding.UTF8.GetBytes(value));
        return BinaryPrimitives.ReadUInt64LittleEndian(hasher.Finalize().AsSpan());
    }

    static ulong Blake3Hash(ulong value)
    {
        byte[] input = new byte[8];
        BinaryPrimitives.WriteUInt64LittleEndian(input, value);
        using var hasher = Hasher.New();
        hasher.Update(input);
        return BinaryPrimitives.ReadUInt64LittleEndian(hasher.Finalize().AsSpan());
    }

    static byte[] AesDecryptEcb(byte[] data, byte[] key)
    {
        using var aes = Aes.Create();
        aes.Mode = CipherMode.ECB;
        aes.Padding = PaddingMode.None;
        aes.Key = key;

        using var decryptor = aes.CreateDecryptor();
        return decryptor.TransformFinalBlock(data, 0, data.Length);
    }

    static byte[] AesEncryptEcb(byte[] data, byte[] key)
    {
        using var aes = Aes.Create();
        aes.Mode = CipherMode.ECB;
        aes.Padding = PaddingMode.None;
        aes.Key = key;

        using var encryptor = aes.CreateEncryptor();
        return encryptor.TransformFinalBlock(data, 0, data.Length);
    }

    static void XorBytes(byte[] data, byte[] key)
    {
        if (data.Length <= 4 && key.Length == 4) return;
        for (int i = 0; i < data.Length; i++)
        {
            data[i] ^= key[i % key.Length];
        }
    }

    static string EscapeCsv(string s)
    {
        if (s == null) return "\"\"";
        if (s.Contains('"') || s.Contains(',') || s.Contains('\n') || s.Contains('\r'))
        {
            return "\"" + s.Replace("\"", "\"\"") + "\"";
        }
        return s;
    }
}
