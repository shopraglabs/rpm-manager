#!/usr/bin/env python3
"""Generate PWA icon PNGs for RPM Manager."""
import struct
import zlib
import os

ICONS_DIR = os.path.join(os.path.dirname(__file__), "../public/icons")
os.makedirs(ICONS_DIR, exist_ok=True)

def make_png(size: int, bg: tuple[int, int, int]) -> bytes:
    r, g, b = bg
    rows = []
    for _y in range(size):
        row = bytearray([0])  # filter byte: None
        for _x in range(size):
            row += bytearray([r, g, b, 255])
        rows.append(bytes(row))

    raw = b"".join(rows)
    compressed = zlib.compress(raw, 9)

    def chunk(tag: bytes, data: bytes) -> bytes:
        payload = tag + data
        return (
            struct.pack(">I", len(data))
            + payload
            + struct.pack(">I", zlib.crc32(payload) & 0xFFFFFFFF)
        )

    # IHDR: width, height, bit_depth=8, color_type=2 (RGB), compress=0, filter=0, interlace=0
    ihdr_data = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", ihdr_data)
    png += chunk(b"IDAT", compressed)
    png += chunk(b"IEND", b"")
    return png


# Blue: #1d4ed8 = rgb(29, 78, 216)
BLUE = (29, 78, 216)

sizes = [("icon-192.png", 192), ("icon-512.png", 512), ("apple-touch-icon.png", 180)]
for filename, size in sizes:
    path = os.path.join(ICONS_DIR, filename)
    with open(path, "wb") as f:
        f.write(make_png(size, BLUE))
    print(f"Created {filename} ({size}x{size})")
