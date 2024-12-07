const express = require("express");
const multer = require("multer");
const axios = require("axios");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Configuración de multer para cargar imágenes
const upload = multer({ dest: "uploads/" });

// Ruta principal para servir el frontend
app.use(express.static("public"));

// Ruta para procesar imágenes
app.post("/procesar-imagen", upload.single("imagen"), async (req, res) => {
    const imagenPath = req.file.path;

    try {
        // Paso 1: Validar imagen con Google SafeSearch
        const safeSearchResult = await validarSafeSearch(imagenPath);

        if (safeSearchResult.adult === "VERY_LIKELY" || safeSearchResult.violence === "VERY_LIKELY") {
            fs.unlinkSync(imagenPath); // Eliminar imagen insegura
            return res.status(400).json({ error: "Contenido inapropiado detectado." });
        }

        // Paso 2: Procesar con YOLOv8
        const resultadoYOLO = await procesarConYOLO(imagenPath);

        // Devolver la imagen procesada
        res.sendFile(resultadoYOLO, () => {
            fs.unlinkSync(imagenPath); // Limpiar imagen original
            fs.unlinkSync(resultadoYOLO); // Limpiar imagen procesada
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error procesando la imagen." });
    }
});

// Validar imagen con Google SafeSearch
async function validarSafeSearch(imagenPath) {
    const vision = require("@google-cloud/vision");
    const client = new vision.ImageAnnotatorClient();

    const [result] = await client.safeSearchDetection({
        image: { content: fs.readFileSync(imagenPath) },
    });

    return result.safeSearchAnnotation;
}

// Procesar imagen con YOLOv8
function procesarConYOLO(imagenPath) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.resolve("yolov8_model", "procesar_imagen.py");
        const outputPath = path.resolve("uploads", `procesada_${Date.now()}.jpg`);

        const python = spawn("python", [scriptPath, imagenPath, outputPath]);

        python.on("close", (code) => {
            if (code === 0) resolve(outputPath);
            else reject(new Error("Error ejecutando YOLOv8."));
        });
    });
}

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
