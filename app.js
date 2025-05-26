const express = require('express');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// --- Generic Helper function to read data from file ---
function readDataFromFile(filePath, callback) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') { // File not found
        return callback(null, []); // Return empty array if file doesn't exist
      }
      return callback(err); // Other read errors
    }
    if (data === '') { // File is empty
        return callback(null, []);
    }
    try {
      const jsonData = JSON.parse(data);
      return callback(null, jsonData);
    } catch (parseError) {
      return callback(parseError); // JSON parsing error
    }
  });
}

// --- Generic Helper function to write data to file ---
function writeDataToFile(filePath, data, callback) {
  fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8', (err) => {
    if (err) {
      return callback(err);
    }
    return callback(null);
  });
}

// --- Helper function to generate a new ID ---
function generateNewId(items) {
  if (!items || items.length === 0) {
    return 1;
  }
  return Math.max(...items.map(item => item.id || 0)) + 1;
}

// --- GET /products endpoint ---
app.get('/products', (req, res, next) => {
  readDataFromFile('products.json', (err, products) => {
    if (err) {
      console.error("Error reading products.json:", err);
      return next(err); // Pass to generic error handler
    }
    res.json(products);
  });
});

// --- POST /products endpoint ---
app.post('/products', (req, res, next) => {
  const { name, price, quantity } = req.body;

  // --- Validation ---
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ message: 'Invalid product name. Name must be a non-empty string.' });
  }
  if (price === undefined || typeof price !== 'number' || price <= 0) {
    return res.status(400).json({ message: 'Invalid product price. Price must be a positive number.' });
  }
  if (quantity === undefined || typeof quantity !== 'number' || quantity < 0 || !Number.isInteger(quantity)) {
    return res.status(400).json({ message: 'Invalid product quantity. Quantity must be a non-negative integer.' });
  }

  readDataFromFile('products.json', (err, products) => {
    if (err) {
        console.error("Error reading products.json for POST:", err);
        return next(err);
    }

    const newProductId = generateNewId(products);
    const newProduct = {
      id: newProductId,
      name: name.trim(),
      price,
      quantity
    };

    products.push(newProduct);

    writeDataToFile('products.json', products, (writeErr) => {
      if (writeErr) {
        console.error("Error writing products.json:", writeErr);
        return next(writeErr);
      }
      res.status(201).json(newProduct);
    });
  });
});

// --- POST /checklists endpoint ---
app.post('/checklists', (req, res, next) => {
  const { nombre_operador, tipo_equipo, id_equipo, fecha_hora, checklist, observaciones } = req.body;

  // --- Validation ---
  if (!nombre_operador || typeof nombre_operador !== 'string' || nombre_operador.trim() === '') {
    return res.status(400).json({ message: 'Nombre de operador inválido. Debe ser una cadena de texto no vacía.' });
  }
  if (!tipo_equipo || !['Montacargas', 'Apilador Eléctrico'].includes(tipo_equipo)) {
    return res.status(400).json({ message: 'Tipo de equipo inválido. Debe ser "Montacargas" o "Apilador Eléctrico".' });
  }
  if (!id_equipo || (typeof id_equipo !== 'string' && typeof id_equipo !== 'number') || String(id_equipo).trim() === '') {
    return res.status(400).json({ message: 'ID de equipo inválido. Debe ser una cadena de texto o número no vacío.' });
  }
  if (!fecha_hora || typeof fecha_hora !== 'string' || fecha_hora.trim() === '') { // Basic check, can be enhanced
    return res.status(400).json({ message: 'Fecha y hora inválida. Debe ser una cadena de texto no vacía.' });
  }
  if (!checklist || !Array.isArray(checklist) || checklist.length === 0) {
    return res.status(400).json({ message: 'Checklist inválido. Debe ser un arreglo no vacío.' });
  }

  for (const item of checklist) {
    if (!item.item_name || typeof item.item_name !== 'string' || item.item_name.trim() === '') {
      return res.status(400).json({ message: `Nombre de item inválido en checklist: "${item.item_name}". Debe ser una cadena de texto no vacía.` });
    }
    if (!item.status || !['OK', 'FALLA'].includes(item.status)) {
      return res.status(400).json({ message: `Estado inválido para el item "${item.item_name}": "${item.status}". Debe ser "OK" o "FALLA".` });
    }
  }

  const generatedAlerts = [];
  for (const item of checklist) {
    if (item.status === 'FALLA') {
      generatedAlerts.push({
        // checklist_id will be added later
        id_equipo: String(id_equipo).trim(),
        tipo_equipo,
        item_name: item.item_name.trim(),
        status_item: "FALLA", 
        fecha_hora_checklist: fecha_hora,
        observaciones_checklist: observaciones || "", 
        alert_logged_time: new Date().toISOString()
      });
    }
  }

  readDataFromFile('./checklists.json', (err, checklistsData) => {
    if (err) {
      console.error("Error reading checklists.json:", err);
      return next(err);
    }

    const newChecklistId = generateNewId(checklistsData);
    const newChecklist = {
      id: newChecklistId,
      nombre_operador: nombre_operador.trim(),
      tipo_equipo,
      id_equipo: String(id_equipo).trim(),
      fecha_hora,
      checklist, // items in checklist will already have "status": "FALLA" or "OK"
      observaciones: observaciones || ""
    };

    checklistsData.push(newChecklist);

    writeDataToFile('./checklists.json', checklistsData, (writeErr) => {
      if (writeErr) {
        console.error("Error writing checklists.json:", writeErr);
        return next(writeErr);
      }

      if (generatedAlerts.length > 0) {
        // Assign checklist_id to alerts
        generatedAlerts.forEach(alert => alert.checklist_id = newChecklistId);

        readDataFromFile('./alertas_mantenimiento.json', (alertReadErr, maintenanceAlertsData) => {
          if (alertReadErr) {
            console.error("Error reading alertas_mantenimiento.json:", alertReadErr);
            return next(alertReadErr);
          }
          
          // Generate alert_id for each new alert before adding
          generatedAlerts.forEach(alert => {
            alert.alert_id = generateNewId(maintenanceAlertsData); 
            maintenanceAlertsData.push(alert); 
          });

          writeDataToFile('./alertas_mantenimiento.json', maintenanceAlertsData, (alertWriteErr) => {
            if (alertWriteErr) {
              console.error("Error writing alertas_mantenimiento.json:", alertWriteErr);
              return next(alertWriteErr);
            }
            res.status(201).json({ message: "Checklist enviado con éxito. Alertas de mantenimiento generadas.", checklist_id: newChecklistId });
          });
        });
      } else {
        res.status(201).json({ message: "Checklist enviado con éxito.", checklist_id: newChecklistId });
      }
    });
  });
});

// --- Generic Error Handler ---
// This should be defined after all other app.use() and routes calls
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack || err.message || err); // Log the error stack for debugging
  res.status(500).json({ message: 'Internal Server Error' });
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app; // Export for potential testing
