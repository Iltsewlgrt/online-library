from pypdf import PdfReader
import sys
path = r"C:\Users\annll\OneDrive\Рабочий стол\library\Twelvedevs - Тестовое задание (FS) - Онлайн-библиотека 1.pdf"
try:
    reader = PdfReader(path)
except Exception as e:
    print(f"ERROR_OPENING:{e}", file=sys.stderr)
    sys.exit(2)
for i, page in enumerate(reader.pages, start=1):
    t = page.extract_text() or ""
    print(f"\n----- PAGE {i} -----\n")
    print(t)
