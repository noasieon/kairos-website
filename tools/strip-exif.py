"""사진 속 숨은 정보(EXIF: 촬영 위치 GPS, 기기, 날짜 등)를 확인하고 지웁니다.

  python3 tools/strip-exif.py           # 확인만
  python3 tools/strip-exif.py --strip   # 지우기 (사진 화질은 그대로, 다시 압축하지 않음)

회전 정보(Orientation)가 1이 아닌 사진은 지우면 옆으로 누울 수 있어 건너뛰고 알려 줍니다.
"""
import os
import struct
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, 'assets', 'img')


def segments(data):
    """JPEG 마커 구간을 (시작, 끝, 마커) 로 돌려줌. SOS 이후는 통째로 하나."""
    i = 2
    while i < len(data) - 1:
        if data[i] != 0xFF:
            return
        marker = data[i + 1]
        if marker == 0xDA:  # Start of Scan
            yield i, len(data), marker
            return
        length = struct.unpack('>H', data[i + 2:i + 4])[0]
        yield i, i + 2 + length, marker
        i += 2 + length


def exif_info(seg):
    """APP1 Exif 구간에서 GPS 여부와 Orientation 값을 읽음."""
    body = seg[10:]  # FFE1 + len(2) + 'Exif\0\0'
    if body[:2] not in (b'II', b'MM'):
        return False, 1
    end = '<' if body[:2] == b'II' else '>'
    ifd = struct.unpack(end + 'I', body[4:8])[0]
    n = struct.unpack(end + 'H', body[ifd:ifd + 2])[0]
    gps, orient = False, 1
    for k in range(n):
        e = body[ifd + 2 + k * 12: ifd + 14 + k * 12]
        tag = struct.unpack(end + 'H', e[:2])[0]
        if tag == 0x8825:
            gps = True
        if tag == 0x0112:
            orient = struct.unpack(end + 'H', e[8:10])[0]
    return gps, orient


strip = '--strip' in sys.argv
total = with_exif = with_gps = stripped = 0
for dirpath, _, files in os.walk(IMG):
    for f in sorted(files):
        if not f.lower().endswith(('.jpg', '.jpeg')):
            continue
        p = os.path.join(dirpath, f)
        data = open(p, 'rb').read()
        if data[:2] != b'\xff\xd8':
            continue
        total += 1
        keep, has_exif, gps, orient = [data[:2]], False, False, 1
        for a, b, m in segments(data):
            seg = data[a:b]
            if m == 0xE1 and seg[4:10] == b'Exif\x00\x00':
                has_exif = True
                g, o = exif_info(seg)
                gps = gps or g
                orient = o
                continue
            if m == 0xE1 and b'http://ns.adobe.com/xap' in seg[:40]:  # XMP (위치가 들어갈 수 있음)
                has_exif = True
                gps = gps or (b'GPS' in seg)
                continue
            keep.append(seg)
        if not has_exif:
            continue
        with_exif += 1
        with_gps += gps
        rel = os.path.relpath(p, ROOT)
        if orient != 1:
            print(f'건너뜀(회전 {orient}): {rel}  GPS={gps}')
            continue
        if strip:
            open(p, 'wb').write(b''.join(keep))
            stripped += 1
        print(f'{"지움" if strip else "있음"}: {rel}  GPS={gps}')

print(f'\n사진 {total}장 · EXIF {with_exif}장 · 위치정보 {with_gps}장' + (f' · 지운 사진 {stripped}장' if strip else ''))
