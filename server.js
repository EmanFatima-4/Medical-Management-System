const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "clinic-data.json");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`.toUpperCase();
}

function createDemoData() {
  const today = todayDate();
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 8);
  const past = pastDate.toISOString().slice(0, 10);

  return {
    doctors: [
      {
        id: "DOC-1001",
        name: "Dr. Ayesha Khan",
        specialization: "Cardiologist",
        phone: "555-0101",
        email: "ayesha.khan@clinic.test",
        room: "Room 204",
        fee: 75,
      },
      {
        id: "DOC-1002",
        name: "Dr. Omar Malik",
        specialization: "General Physician",
        phone: "555-0102",
        email: "omar.malik@clinic.test",
        room: "Room 108",
        fee: 45,
      },
    ],
    patients: [
      {
        id: "PAT-1001",
        name: "Sara Ahmed",
        age: 32,
        gender: "Female",
        phone: "555-0144",
        email: "sara.ahmed@example.com",
        address: "House 22, Main Road",
        bloodGroup: "B+",
        allergies: "Penicillin",
        createdAt: today,
      },
      {
        id: "PAT-1002",
        name: "Bilal Raza",
        age: 44,
        gender: "Male",
        phone: "555-0188",
        email: "bilal.raza@example.com",
        address: "Street 9, Garden Town",
        bloodGroup: "O+",
        allergies: "None",
        createdAt: today,
      },
    ],
    appointments: [
      {
        id: "APT-1001",
        patientId: "PAT-1001",
        doctorId: "DOC-1001",
        date: today,
        time: "10:30",
        reason: "Chest pain follow-up",
        status: "pending",
        createdAt: today,
      },
      {
        id: "APT-1002",
        patientId: "PAT-1002",
        doctorId: "DOC-1002",
        date: today,
        time: "13:00",
        reason: "Fever and weakness",
        status: "accepted",
        createdAt: today,
      },
      {
        id: "APT-1003",
        patientId: "PAT-1001",
        doctorId: "DOC-1002",
        date: past,
        time: "09:15",
        reason: "Routine checkup",
        status: "completed",
        createdAt: past,
      },
    ],
    treatments: [
      {
        id: "TRT-1001",
        appointmentId: "APT-1003",
        patientId: "PAT-1001",
        doctorId: "DOC-1002",
        date: past,
        disease: "Viral infection",
        prescription: "Paracetamol 500mg twice daily for 3 days. Hydration and rest.",
        progress: "Symptoms improved. No fever at completion.",
      },
    ],
    bills: [
      {
        id: "BIL-1001",
        appointmentId: "APT-1003",
        patientId: "PAT-1001",
        doctorId: "DOC-1002",
        date: past,
        consultationFee: 45,
        medicineFee: 18,
        labFee: 0,
        otherFee: 7,
        total: 70,
        status: "paid",
      },
    ],
  };
}

function ensureDatabase() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) writeData(createDemoData());
}

function readData() {
  ensureDatabase();
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function writeData(data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, `${JSON.stringify(data, null, 2)}\n`);
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function sendError(response, status, message) {
  sendJson(response, status, { error: message });
}

function parseBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error("Request body is too large."));
      }
    });

    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });

    request.on("error", reject);
  });
}

function requireFields(payload, fields) {
  const missing = fields.filter((field) => payload[field] === undefined || payload[field] === "");
  return missing.length ? `Missing required field(s): ${missing.join(", ")}` : "";
}

function toNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

async function handleApi(request, response, pathname) {
  const method = request.method;

  if (method === "GET" && pathname === "/api/health") {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (method === "GET" && pathname === "/api/data") {
    sendJson(response, 200, { data: readData() });
    return;
  }

  if (method === "POST" && pathname === "/api/reset") {
    const data = createDemoData();
    writeData(data);
    sendJson(response, 200, { data });
    return;
  }

  const data = readData();
  const payload = await parseBody(request);

  if (method === "POST" && pathname === "/api/patients") {
    const validation = requireFields(payload, ["name", "age", "gender", "phone", "address"]);
    if (validation) return sendError(response, 400, validation);

    const patient = {
      id: createId("PAT"),
      name: String(payload.name).trim(),
      age: toNumber(payload.age),
      gender: String(payload.gender).trim(),
      phone: String(payload.phone).trim(),
      email: String(payload.email || "").trim(),
      address: String(payload.address).trim(),
      bloodGroup: String(payload.bloodGroup || "").trim(),
      allergies: String(payload.allergies || "None").trim() || "None",
      createdAt: todayDate(),
    };

    data.patients.unshift(patient);
    writeData(data);
    sendJson(response, 201, { patient, data });
    return;
  }

  if (method === "POST" && pathname === "/api/appointments") {
    const validation = requireFields(payload, ["patientId", "doctorId", "date", "time", "reason"]);
    if (validation) return sendError(response, 400, validation);
    if (!data.patients.some((patient) => patient.id === payload.patientId)) {
      return sendError(response, 404, "Patient not found.");
    }
    if (!data.doctors.some((doctor) => doctor.id === payload.doctorId)) {
      return sendError(response, 404, "Doctor not found.");
    }

    const appointment = {
      id: createId("APT"),
      patientId: payload.patientId,
      doctorId: payload.doctorId,
      date: payload.date,
      time: payload.time,
      reason: String(payload.reason).trim(),
      status: "pending",
      createdAt: todayDate(),
    };

    data.appointments.unshift(appointment);
    writeData(data);
    sendJson(response, 201, { appointment, data });
    return;
  }

  const statusMatch = pathname.match(/^\/api\/appointments\/([^/]+)\/status$/);
  if (method === "PATCH" && statusMatch) {
    const appointment = data.appointments.find((item) => item.id === statusMatch[1]);
    if (!appointment) return sendError(response, 404, "Appointment not found.");
    if (!["accepted", "rejected"].includes(payload.status)) {
      return sendError(response, 400, "Status must be accepted or rejected.");
    }
    if (appointment.status !== "pending") {
      return sendError(response, 409, "Only pending appointments can be accepted or rejected.");
    }

    appointment.status = payload.status;
    writeData(data);
    sendJson(response, 200, { appointment, data });
    return;
  }

  if (method === "POST" && pathname === "/api/treatments") {
    const validation = requireFields(payload, ["appointmentId", "disease", "prescription", "progress"]);
    if (validation) return sendError(response, 400, validation);

    const appointment = data.appointments.find((item) => item.id === payload.appointmentId);
    if (!appointment) return sendError(response, 404, "Appointment not found.");
    if (!["accepted", "completed"].includes(appointment.status)) {
      return sendError(response, 409, "Treatment can only be updated for accepted or completed appointments.");
    }

    const existing = data.treatments.find((item) => item.appointmentId === appointment.id);
    const treatmentPayload = {
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      date: appointment.date,
      disease: String(payload.disease).trim(),
      prescription: String(payload.prescription).trim(),
      progress: String(payload.progress).trim(),
    };

    let treatment;
    if (existing) {
      Object.assign(existing, treatmentPayload);
      treatment = existing;
    } else {
      treatment = { id: createId("TRT"), ...treatmentPayload };
      data.treatments.unshift(treatment);
    }

    appointment.status = "completed";
    writeData(data);
    sendJson(response, 200, { treatment, data });
    return;
  }

  if (method === "POST" && pathname === "/api/bills") {
    const validation = requireFields(payload, ["appointmentId", "consultationFee", "status"]);
    if (validation) return sendError(response, 400, validation);

    const appointment = data.appointments.find((item) => item.id === payload.appointmentId);
    if (!appointment) return sendError(response, 404, "Appointment not found.");
    if (appointment.status !== "completed") {
      return sendError(response, 409, "Bill can only be generated for completed appointments.");
    }
    if (data.bills.some((bill) => bill.appointmentId === appointment.id)) {
      return sendError(response, 409, "A bill already exists for this appointment.");
    }

    const consultationFee = toNumber(payload.consultationFee);
    const medicineFee = toNumber(payload.medicineFee);
    const labFee = toNumber(payload.labFee);
    const otherFee = toNumber(payload.otherFee);
    const bill = {
      id: createId("BIL"),
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      date: appointment.date,
      consultationFee,
      medicineFee,
      labFee,
      otherFee,
      total: consultationFee + medicineFee + labFee + otherFee,
      status: payload.status === "paid" ? "paid" : "unpaid",
    };

    data.bills.unshift(bill);
    writeData(data);
    sendJson(response, 201, { bill, data });
    return;
  }

  sendError(response, 404, "API route not found.");
}

function serveStatic(request, response, pathname) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(ROOT, safePath);

  if (!filePath.startsWith(ROOT)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const contentType = contentTypes[path.extname(filePath)] || "application/octet-stream";
    response.writeHead(200, { "Content-Type": contentType });
    response.end(content);
  });
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const pathname = decodeURIComponent(url.pathname);

    if (pathname.startsWith("/api/")) {
      await handleApi(request, response, pathname);
      return;
    }

    serveStatic(request, response, pathname);
  } catch (error) {
    sendError(response, 500, error.message || "Server error.");
  }
});

server.listen(PORT, () => {
  console.log(`Medical Management System running at http://localhost:${PORT}`);
});
