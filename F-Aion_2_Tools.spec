# -*- mode: python ; coding: utf-8 -*-
import os
from PyInstaller.utils.hooks import collect_data_files

block_cipher = None

a = Analysis(
    ['app.py'],
    pathex=['.'],
    binaries=[],
    datas=[
        ('release/AION2_VietHoa_Standalone/Data', 'Data'),
        ('gui/dist/index.html', 'gui/dist'),
        ('gui/dist/twitch_drops_window.html', 'gui/dist'),
        ('twitch_drops_window.html', '.'),
        ('plugins/twitch_drops', 'plugins/twitch_drops'),
        ('dps_meter', 'dps_meter'),
        ('fear_logo.ico', '.'),
        ('fear_logo.png', '.')
    ] + collect_data_files('webview'),
    hiddenimports=[
        'webview',
        'clr',
        'winreg',
        'webbrowser',
        'PIL',
        'urllib.request',
        'urllib.error',
        'hashlib',
        'gzip',
        'base64',
        're',
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
    name='F-Aion 2 Tools',
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
    uac_admin=True,
)
