# -*- mode: python ; coding: utf-8 -*-
import os

block_cipher = None

a = Analysis(
    ['twitch_drops_app.py'],
    pathex=['.'],
    binaries=[],
    datas=[
        ('twitch_drops_window.html', '.'),
        ('fear_logo.ico', '.'),
        ('fear_logo.png', '.')
    ],
    hiddenimports=[
        'webview',
        'clr',
        'winreg',
        'webbrowser',
        'urllib.request',
        'urllib.error',
        'urllib.parse',
        'hashlib',
        'twitch_drops_service'
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', '_tkinter'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='TwitchDropsMiner',
    icon='fear_logo.ico',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
