# -*- mode: python ; coding: utf-8 -*-
import os

block_cipher = None

a = Analysis(
    ['app.py'],
    pathex=['.'],
    binaries=[],
    datas=[
        ('release/AION2_VietHoa_Standalone/Data', 'Data'),
        ('gui/dist/index.html', 'gui/dist'),
        ('fear_logo.ico', '.'),
        ('fear_logo.png', '.')
    ],
    hiddenimports=[
        'webview',
        'clr',
        'tkinter',
        'tkinter.filedialog',
        'winreg',
        'webbrowser',
        'PIL',
        'urllib.request',
        'urllib.error',
        'hashlib'
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
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
    upx=True,
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
