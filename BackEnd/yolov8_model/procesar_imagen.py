import sys
from ultralytics import YOLO
from PIL import Image, ImageDraw

# Leer argumentos
input_path = sys.argv[1]
output_path = sys.argv[2]

# Cargar el modelo
modelo = YOLO("path/to/your/yolov8_model.pt")

# Procesar la imagen
resultados = modelo.predict(source=input_path, save=False)

# Dibujar las cajas detectadas en la imagen
img = Image.open(input_path).convert("RGB")
draw = ImageDraw.Draw(img)

for box in resultados[0].boxes:
    x1, y1, x2, y2 = box.xyxy[0]
    label = box.cls
    draw.rectangle([x1, y1, x2, y2], outline="red", width=3)
    draw.text((x1, y1), f"Tipo: {label}", fill="red")

img.save(output_path)
