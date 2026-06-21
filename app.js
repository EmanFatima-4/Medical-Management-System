const API_BASE = "/api";
const UI_STORAGE_KEY = "medical-management-ui-v1";

const patientTabs = [
  { id: "patient-create", label: "Patient Creation" },
  { id: "patient-home", label: "Patient Home" },
  { id: "patient-appointments", label: "Patient Appointment" },
  { id: "patient-bills", label: "Bills History" },
  { id: "patient-treatments", label: "Treatment History" },
];

const doctorTabs = [
  { id: "doctor-profile", label: "Doctor Profile" },
  { id: "doctor-pending", label: "Pending Appointments" },
  { id: "doctor-today", label: "Today's Appointments" },
  { id: "doctor-update", label: "History Update" },
  { id: "doctor-bill", label: "Generate Bill" },
  { id: "doctor-history", label: "Patient History" },
];

const state = {
  role: "patient",
  view: "patient-create",
  activePatientId: "",
  activeDoctorId: "",
  data: null,
};

const elements = {
  roleButtons: document.querySelectorAll(".role-button"),
  patientChooserWrap: document.querySelector("#patientChooserWrap"),
  doctorChooserWrap: document.querySelector("#doctorChooserWrap"),
  patientSelect: document.querySelector("#patientSelect"),
  doctorSelect: document.querySelector("#doctorSelect"),
  navList: document.querySelector("#navList"),
  todayLabel: document.querySelector("#todayLabel"),
  quickStats: document.querySelector("#quickStats"),
  portalLabel: document.querySelector("#portalLabel"),
  pageTitle: document.querySelector("#pageTitle"),
  resetDemoBtn: document.querySelector("#resetDemoBtn"),
  viewRoot: document.querySelector("#viewRoot"),
  toast: document.querySelector("#toast"),
};

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatMoney(value) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function createDemoData() {
  const today = todayDate();
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 8);
  const past = pastDate.toISOString().slice(0, 10);

  const doctors = [
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
  ];

  const patients = [
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
  ];

  const appointments = [
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
  ];

  const treatments = [
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
  ];

  const bills = [
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
  ];

  return { doctors, patients, appointments, treatments, bills };
}

async function loadData() {
  const response = await apiRequest("/data");
  state.data = response.data;

  try {
    const parsed = JSON.parse(localStorage.getItem(UI_STORAGE_KEY) || "{}");
    state.role = parsed.role || "patient";
    state.view = parsed.view || "patient-create";
    state.activePatientId = parsed.activePatientId || "";
    state.activeDoctorId = parsed.activeDoctorId || "";
  } catch {
    state.role = "patient";
    state.view = "patient-create";
  }

  state.activePatientId = getPatient(state.activePatientId)?.id || state.data.patients[0]?.id || "";
  state.activeDoctorId = getDoctor(state.activeDoctorId)?.id || state.data.doctors[0]?.id || "";
}

function saveData() {
  localStorage.setItem(
    UI_STORAGE_KEY,
    JSON.stringify({
      role: state.role,
      view: state.view,
      activePatientId: state.activePatientId,
      activeDoctorId: state.activeDoctorId,
    }),
  );
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Request failed.");
  }

  return payload;
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => elements.toast.classList.remove("show"), 2200);
}

function getPatient(id = state.activePatientId) {
  return state.data.patients.find((patient) => patient.id === id) || null;
}

function getDoctor(id = state.activeDoctorId) {
  return state.data.doctors.find((doctor) => doctor.id === id) || null;
}

function getAppointment(id) {
  return state.data.appointments.find((appointment) => appointment.id === id) || null;
}

function patientName(id) {
  return getPatient(id)?.name || "Unknown patient";
}

function doctorName(id) {
  return getDoctor(id)?.name || "Unknown doctor";
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });
}

function statusBadge(status) {
  return `<span class="badge ${escapeHtml(status)}">${escapeHtml(status)}</span>`;
}

function renderShell() {
  elements.roleButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.role === state.role);
  });

  elements.patientChooserWrap.classList.toggle("hidden", state.role !== "patient");
  elements.doctorChooserWrap.classList.toggle("hidden", state.role !== "doctor");
  elements.portalLabel.textContent = state.role === "patient" ? "Patient Portal" : "Doctor Portal";
  elements.todayLabel.textContent = formatDate(todayDate());

  renderSelectors();
  renderNav();
  renderStats();
  renderView();
}

function renderSelectors() {
  elements.patientSelect.innerHTML = state.data.patients
    .map(
      (patient) =>
        `<option value="${escapeHtml(patient.id)}" ${
          patient.id === state.activePatientId ? "selected" : ""
        }>${escapeHtml(patient.name)} (${escapeHtml(patient.id)})</option>`,
    )
    .join("");

  elements.doctorSelect.innerHTML = state.data.doctors
    .map(
      (doctor) =>
        `<option value="${escapeHtml(doctor.id)}" ${
          doctor.id === state.activeDoctorId ? "selected" : ""
        }>${escapeHtml(doctor.name)} (${escapeHtml(doctor.specialization)})</option>`,
    )
    .join("");
}

function renderNav() {
  const tabs = state.role === "patient" ? patientTabs : doctorTabs;
  const counts = getNavCounts();

  elements.navList.innerHTML = tabs
    .map(
      (tab) => `
        <button class="nav-button ${state.view === tab.id ? "active" : ""}" data-view="${tab.id}" type="button">
          <span>${escapeHtml(tab.label)}</span>
          ${counts[tab.id] ? `<span class="nav-count">${counts[tab.id]}</span>` : ""}
        </button>
      `,
    )
    .join("");
}

function getNavCounts() {
  const today = todayDate();

  if (state.role === "patient") {
    return {
      "patient-bills": state.data.bills.filter((bill) => bill.patientId === state.activePatientId).length,
      "patient-treatments": state.data.treatments.filter(
        (treatment) => treatment.patientId === state.activePatientId,
      ).length,
      "patient-appointments": state.data.appointments.filter(
        (appointment) => appointment.patientId === state.activePatientId,
      ).length,
    };
  }

  return {
    "doctor-pending": state.data.appointments.filter(
      (appointment) => appointment.doctorId === state.activeDoctorId && appointment.status === "pending",
    ).length,
    "doctor-today": state.data.appointments.filter(
      (appointment) => appointment.doctorId === state.activeDoctorId && appointment.date === today,
    ).length,
    "doctor-history": state.data.treatments.filter(
      (treatment) => treatment.doctorId === state.activeDoctorId,
    ).length,
  };
}

function renderStats() {
  const today = todayDate();
  const pending = state.data.appointments.filter((appointment) => appointment.status === "pending").length;
  const todays = state.data.appointments.filter((appointment) => appointment.date === today).length;
  const completed = state.data.appointments.filter((appointment) => appointment.status === "completed").length;

  elements.quickStats.textContent = `${state.data.patients.length} patients, ${todays} today, ${pending} pending, ${completed} completed`;
}

function renderView() {
  const allTabs = [...patientTabs, ...doctorTabs];
  const current = allTabs.find((tab) => tab.id === state.view) || allTabs[0];
  elements.pageTitle.textContent = current.label;

  const views = {
    "patient-create": renderPatientCreate,
    "patient-home": renderPatientHome,
    "patient-appointments": renderPatientAppointments,
    "patient-bills": renderPatientBills,
    "patient-treatments": renderPatientTreatments,
    "doctor-profile": renderDoctorProfile,
    "doctor-pending": renderDoctorPending,
    "doctor-today": renderDoctorToday,
    "doctor-update": renderDoctorUpdate,
    "doctor-bill": renderDoctorBill,
    "doctor-history": renderDoctorHistory,
  };

  elements.viewRoot.innerHTML = views[state.view]();
  bindViewEvents();
}

function renderPatientCreate() {
  return `
    <form class="panel" id="patientForm">
      <div class="panel-header">
        <div>
          <h3>Create Patient</h3>
          <p class="muted">Register a patient profile that can book appointments and view history.</p>
        </div>
      </div>
      <div class="panel-body">
        <div class="form-grid">
          ${field("Full name", "name", "text", "e.g. Fatima Noor", true)}
          ${field("Age", "age", "number", "e.g. 29", true)}
          ${selectField("Gender", "gender", ["Female", "Male", "Other"], true)}
          ${field("Phone", "phone", "tel", "e.g. 555-0199", true)}
          ${field("Email", "email", "email", "patient@example.com", false)}
          ${field("Blood group", "bloodGroup", "text", "e.g. A+", false)}
          ${field("Allergies", "allergies", "text", "e.g. None", false)}
          ${field("Address", "address", "text", "Street, city", true, "full")}
        </div>
        <div class="action-row">
          <button class="primary-button" type="submit">Create Patient</button>
        </div>
      </div>
    </form>
    ${renderPatientDirectory()}
  `;
}

function renderPatientDirectory() {
  return `
    <section class="panel">
      <div class="panel-header">
        <h3>Patient Directory</h3>
        <p class="muted">${state.data.patients.length} registered</p>
      </div>
      <div class="panel-body table-wrap">
        ${patientTable(state.data.patients)}
      </div>
    </section>
  `;
}

function renderPatientHome() {
  const patient = getPatient();
  if (!patient) return emptyPanel("No patient selected", "Create a patient first.");

  const appointments = state.data.appointments.filter(
    (appointment) => appointment.patientId === patient.id,
  );
  const completed = appointments.filter((appointment) => appointment.status === "completed").length;
  const pending = appointments.filter((appointment) => appointment.status === "pending").length;

  return `
    <section class="card-grid">
      ${metricCard("Appointments", appointments.length)}
      ${metricCard("Pending", pending)}
      ${metricCard("Completed", completed)}
      ${metricCard("Bills", state.data.bills.filter((bill) => bill.patientId === patient.id).length)}
    </section>
    <section class="panel">
      <div class="panel-header">
        <div>
          <h3>${escapeHtml(patient.name)}</h3>
          <p class="muted">${escapeHtml(patient.id)} • Registered ${formatDate(patient.createdAt)}</p>
        </div>
      </div>
      <div class="panel-body">
        <div class="info-grid">
          ${infoItem("Age", patient.age)}
          ${infoItem("Gender", patient.gender)}
          ${infoItem("Phone", patient.phone)}
          ${infoItem("Email", patient.email || "Not provided")}
          ${infoItem("Blood Group", patient.bloodGroup || "Not provided")}
          ${infoItem("Allergies", patient.allergies || "None")}
          ${infoItem("Address", patient.address)}
        </div>
      </div>
    </section>
  `;
}

function renderPatientAppointments() {
  const patient = getPatient();
  if (!patient) return emptyPanel("No patient selected", "Create a patient first.");

  const appointments = state.data.appointments
    .filter((appointment) => appointment.patientId === patient.id)
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));

  return `
    <form class="panel" id="appointmentForm">
      <div class="panel-header">
        <div>
          <h3>Book Appointment</h3>
          <p class="muted">Create an appointment request for ${escapeHtml(patient.name)}.</p>
        </div>
      </div>
      <div class="panel-body">
        <div class="form-grid">
          <label class="field">
            <span>Doctor</span>
            <select name="doctorId" required>
              ${state.data.doctors
                .map(
                  (doctor) =>
                    `<option value="${escapeHtml(doctor.id)}">${escapeHtml(doctor.name)} - ${escapeHtml(
                      doctor.specialization,
                    )}</option>`,
                )
                .join("")}
            </select>
          </label>
          ${field("Date", "date", "date", "", true, "", todayDate())}
          ${field("Time", "time", "time", "", true)}
          ${textAreaField("Reason", "reason", "Describe symptoms or purpose", true, "full")}
        </div>
        <div class="action-row">
          <button class="primary-button" type="submit">Request Appointment</button>
        </div>
      </div>
    </form>
    <section class="panel">
      <div class="panel-header">
        <h3>Appointment History</h3>
        <p class="muted">${appointments.length} appointment records</p>
      </div>
      <div class="panel-body table-wrap">
        ${appointmentsTable(appointments)}
      </div>
    </section>
  `;
}

function renderPatientBills() {
  const bills = state.data.bills
    .filter((bill) => bill.patientId === state.activePatientId)
    .sort((a, b) => b.date.localeCompare(a.date));

  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h3>Bills History</h3>
          <p class="muted">Bills are shown after completed appointments.</p>
        </div>
      </div>
      <div class="panel-body table-wrap">
        ${billsTable(bills)}
      </div>
    </section>
  `;
}

function renderPatientTreatments() {
  const treatments = state.data.treatments
    .filter((treatment) => treatment.patientId === state.activePatientId)
    .sort((a, b) => b.date.localeCompare(a.date));

  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h3>Treatment History</h3>
          <p class="muted">Completed appointment treatment records.</p>
        </div>
      </div>
      <div class="panel-body table-wrap">
        ${treatmentsTable(treatments)}
      </div>
    </section>
  `;
}

function renderDoctorProfile() {
  const doctor = getDoctor();
  if (!doctor) return emptyPanel("No doctor selected", "Add a doctor in the demo data first.");

  const appointments = state.data.appointments.filter(
    (appointment) => appointment.doctorId === doctor.id,
  );

  return `
    <section class="card-grid">
      ${metricCard("Total Appointments", appointments.length)}
      ${metricCard("Pending", appointments.filter((appointment) => appointment.status === "pending").length)}
      ${metricCard("Completed", appointments.filter((appointment) => appointment.status === "completed").length)}
      ${metricCard("Patients Treated", new Set(state.data.treatments.filter((t) => t.doctorId === doctor.id).map((t) => t.patientId)).size)}
    </section>
    <section class="panel">
      <div class="panel-header">
        <div>
          <h3>${escapeHtml(doctor.name)}</h3>
          <p class="muted">${escapeHtml(doctor.id)} • ${escapeHtml(doctor.specialization)}</p>
        </div>
      </div>
      <div class="panel-body">
        <div class="info-grid">
          ${infoItem("Specialization", doctor.specialization)}
          ${infoItem("Phone", doctor.phone)}
          ${infoItem("Email", doctor.email)}
          ${infoItem("Room", doctor.room)}
          ${infoItem("Consultation Fee", formatMoney(doctor.fee))}
        </div>
      </div>
    </section>
  `;
}

function renderDoctorPending() {
  const appointments = state.data.appointments
    .filter(
      (appointment) => appointment.doctorId === state.activeDoctorId && appointment.status === "pending",
    )
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h3>Pending Appointments</h3>
          <p class="muted">All appointment requests against this doctor ID.</p>
        </div>
      </div>
      <div class="panel-body table-wrap">
        ${doctorActionAppointmentsTable(appointments, true)}
      </div>
    </section>
  `;
}

function renderDoctorToday() {
  const today = todayDate();
  const appointments = state.data.appointments
    .filter((appointment) => appointment.doctorId === state.activeDoctorId && appointment.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));

  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h3>Today's Appointments</h3>
          <p class="muted">Accept or reject today's pending appointments.</p>
        </div>
        <span class="badge today">${formatDate(today)}</span>
      </div>
      <div class="panel-body table-wrap">
        ${doctorActionAppointmentsTable(appointments, true)}
      </div>
    </section>
  `;
}

function renderDoctorUpdate() {
  const eligible = state.data.appointments.filter(
    (appointment) =>
      appointment.doctorId === state.activeDoctorId &&
      ["accepted", "completed"].includes(appointment.status),
  );

  if (!eligible.length) {
    return emptyPanel(
      "No accepted appointments",
      "Accept an appointment first, then update disease, prescription, and progress.",
    );
  }

  return `
    <form class="panel" id="treatmentForm">
      <div class="panel-header">
        <div>
          <h3>History Update</h3>
          <p class="muted">Update prescription, disease, and patient progress.</p>
        </div>
      </div>
      <div class="panel-body">
        <div class="form-grid">
          <label class="field full">
            <span>Appointment</span>
            <select name="appointmentId" required>
              ${eligible.map(treatmentOption).join("")}
            </select>
          </label>
          ${field("Disease", "disease", "text", "Diagnosis", true)}
          ${textAreaField("Prescription", "prescription", "Medicine and dosage", true)}
          ${textAreaField("Progress", "progress", "Patient progress notes", true)}
        </div>
        <div class="action-row">
          <button class="primary-button" type="submit">Save Treatment</button>
        </div>
      </div>
    </form>
  `;
}

function renderDoctorBill() {
  const completedWithoutBill = state.data.appointments.filter(
    (appointment) =>
      appointment.doctorId === state.activeDoctorId &&
      appointment.status === "completed" &&
      !state.data.bills.some((bill) => bill.appointmentId === appointment.id),
  );

  if (!completedWithoutBill.length) {
    return emptyPanel(
      "No billable completed appointments",
      "Complete a treatment update first, or choose another doctor.",
    );
  }

  const doctor = getDoctor();

  return `
    <form class="panel" id="billForm">
      <div class="panel-header">
        <div>
          <h3>Generate Bill</h3>
          <p class="muted">Create a bill after the treatment is completed.</p>
        </div>
      </div>
      <div class="panel-body">
        <div class="form-grid">
          <label class="field full">
            <span>Completed appointment</span>
            <select name="appointmentId" required>
              ${completedWithoutBill.map(treatmentOption).join("")}
            </select>
          </label>
          ${field("Consultation fee", "consultationFee", "number", "0", true, "", doctor?.fee || 0)}
          ${field("Medicine fee", "medicineFee", "number", "0", false, "", 0)}
          ${field("Lab fee", "labFee", "number", "0", false, "", 0)}
          ${field("Other fee", "otherFee", "number", "0", false, "", 0)}
          ${selectField("Status", "status", ["paid", "unpaid"], true)}
        </div>
        <div class="action-row">
          <button class="primary-button" type="submit">Generate Bill</button>
        </div>
      </div>
    </form>
  `;
}

function renderDoctorHistory() {
  const treatments = state.data.treatments
    .filter((treatment) => treatment.doctorId === state.activeDoctorId)
    .sort((a, b) => b.date.localeCompare(a.date));

  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h3>Patient History</h3>
          <p class="muted">Treatment history of all patients treated by this doctor.</p>
        </div>
      </div>
      <div class="panel-body table-wrap">
        ${treatmentsTable(treatments)}
      </div>
    </section>
  `;
}

function field(label, name, type, placeholder, required = false, extraClass = "", value = "") {
  return `
    <label class="field ${extraClass}">
      <span>${escapeHtml(label)}</span>
      <input name="${escapeHtml(name)}" type="${escapeHtml(type)}" placeholder="${escapeHtml(
        placeholder,
      )}" value="${escapeHtml(value)}" ${required ? "required" : ""} />
    </label>
  `;
}

function selectField(label, name, options, required = false) {
  return `
    <label class="field">
      <span>${escapeHtml(label)}</span>
      <select name="${escapeHtml(name)}" ${required ? "required" : ""}>
        ${options.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join("")}
      </select>
    </label>
  `;
}

function textAreaField(label, name, placeholder, required = false, extraClass = "") {
  return `
    <label class="field ${extraClass}">
      <span>${escapeHtml(label)}</span>
      <textarea name="${escapeHtml(name)}" placeholder="${escapeHtml(placeholder)}" ${
        required ? "required" : ""
      }></textarea>
    </label>
  `;
}

function metricCard(label, value) {
  return `
    <div class="metric-card">
      <span class="metric-label">${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function infoItem(label, value) {
  return `
    <div class="info-item">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function emptyPanel(title, message) {
  return `
    <section class="empty-panel">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(message)}</p>
    </section>
  `;
}

function patientTable(patients) {
  if (!patients.length) return emptyPanel("No patients", "Create the first patient to begin.");

  return `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Age</th>
          <th>Gender</th>
          <th>Phone</th>
          <th>Blood</th>
        </tr>
      </thead>
      <tbody>
        ${patients
          .map(
            (patient) => `
              <tr>
                <td>${escapeHtml(patient.id)}</td>
                <td>${escapeHtml(patient.name)}</td>
                <td>${escapeHtml(patient.age)}</td>
                <td>${escapeHtml(patient.gender)}</td>
                <td>${escapeHtml(patient.phone)}</td>
                <td>${escapeHtml(patient.bloodGroup || "N/A")}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function appointmentsTable(appointments) {
  if (!appointments.length) return emptyPanel("No appointments", "Book an appointment to see it here.");

  return `
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Time</th>
          <th>Doctor</th>
          <th>Reason</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${appointments
          .map(
            (appointment) => `
              <tr>
                <td>${formatDate(appointment.date)}</td>
                <td>${escapeHtml(appointment.time)}</td>
                <td>${escapeHtml(doctorName(appointment.doctorId))}</td>
                <td>${escapeHtml(appointment.reason)}</td>
                <td>${statusBadge(appointment.status)}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function doctorActionAppointmentsTable(appointments, showActions) {
  if (!appointments.length) return emptyPanel("No appointments found", "There are no matching appointments.");

  return `
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Time</th>
          <th>Patient</th>
          <th>Reason</th>
          <th>Status</th>
          ${showActions ? "<th>Action</th>" : ""}
        </tr>
      </thead>
      <tbody>
        ${appointments
          .map(
            (appointment) => `
              <tr>
                <td>${formatDate(appointment.date)}</td>
                <td>${escapeHtml(appointment.time)}</td>
                <td>${escapeHtml(patientName(appointment.patientId))}</td>
                <td>${escapeHtml(appointment.reason)}</td>
                <td>${statusBadge(appointment.status)}</td>
                ${
                  showActions
                    ? `<td>
                        <div class="status-row">
                          <button class="success-button appointment-action" data-action="accepted" data-id="${escapeHtml(
                            appointment.id,
                          )}" type="button" ${appointment.status !== "pending" ? "disabled" : ""}>Accept</button>
                          <button class="danger-button appointment-action" data-action="rejected" data-id="${escapeHtml(
                            appointment.id,
                          )}" type="button" ${appointment.status !== "pending" ? "disabled" : ""}>Reject</button>
                        </div>
                      </td>`
                    : ""
                }
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function treatmentsTable(treatments) {
  if (!treatments.length) return emptyPanel("No treatment history", "Completed treatment records will appear here.");

  return `
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Patient</th>
          <th>Doctor</th>
          <th>Disease</th>
          <th>Prescription</th>
          <th>Progress</th>
        </tr>
      </thead>
      <tbody>
        ${treatments
          .map(
            (treatment) => `
              <tr>
                <td>${formatDate(treatment.date)}</td>
                <td>${escapeHtml(patientName(treatment.patientId))}</td>
                <td>${escapeHtml(doctorName(treatment.doctorId))}</td>
                <td>${escapeHtml(treatment.disease)}</td>
                <td>${escapeHtml(treatment.prescription)}</td>
                <td>${escapeHtml(treatment.progress)}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function billsTable(bills) {
  if (!bills.length) return emptyPanel("No bills yet", "Completed appointment bills will appear here.");

  return `
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Doctor</th>
          <th>Consultation</th>
          <th>Medicine</th>
          <th>Lab</th>
          <th>Other</th>
          <th>Total</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${bills
          .map(
            (bill) => `
              <tr>
                <td>${formatDate(bill.date)}</td>
                <td>${escapeHtml(doctorName(bill.doctorId))}</td>
                <td>${formatMoney(bill.consultationFee)}</td>
                <td>${formatMoney(bill.medicineFee)}</td>
                <td>${formatMoney(bill.labFee)}</td>
                <td>${formatMoney(bill.otherFee)}</td>
                <td><strong>${formatMoney(bill.total)}</strong></td>
                <td>${statusBadge(bill.status)}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function treatmentOption(appointment) {
  return `
    <option value="${escapeHtml(appointment.id)}">
      ${formatDate(appointment.date)} ${escapeHtml(appointment.time)} - ${escapeHtml(
        patientName(appointment.patientId),
      )} (${escapeHtml(appointment.id)})
    </option>
  `;
}

function bindViewEvents() {
  const patientForm = document.querySelector("#patientForm");
  if (patientForm) patientForm.addEventListener("submit", createPatient);

  const appointmentForm = document.querySelector("#appointmentForm");
  if (appointmentForm) appointmentForm.addEventListener("submit", createAppointment);

  const treatmentForm = document.querySelector("#treatmentForm");
  if (treatmentForm) treatmentForm.addEventListener("submit", saveTreatment);

  const billForm = document.querySelector("#billForm");
  if (billForm) billForm.addEventListener("submit", generateBill);

  document.querySelectorAll(".appointment-action").forEach((button) => {
    button.addEventListener("click", () => {
      updateAppointmentStatus(button.dataset.id, button.dataset.action);
    });
  });
}

async function createPatient(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const patient = {
    name: form.get("name").trim(),
    age: Number(form.get("age")),
    gender: form.get("gender"),
    phone: form.get("phone").trim(),
    email: form.get("email").trim(),
    address: form.get("address").trim(),
    bloodGroup: form.get("bloodGroup").trim(),
    allergies: form.get("allergies").trim() || "None",
  };

  try {
    const response = await apiRequest("/patients", {
      method: "POST",
      body: JSON.stringify(patient),
    });
    state.data = response.data;
    state.activePatientId = response.patient.id;
    state.view = "patient-home";
    saveData();
    renderShell();
    showToast("Patient created");
  } catch (error) {
    showToast(error.message);
  }
}

async function createAppointment(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const appointment = {
    patientId: state.activePatientId,
    doctorId: form.get("doctorId"),
    date: form.get("date"),
    time: form.get("time"),
    reason: form.get("reason").trim(),
  };

  try {
    const response = await apiRequest("/appointments", {
      method: "POST",
      body: JSON.stringify(appointment),
    });
    state.data = response.data;
    saveData();
    renderShell();
    showToast("Appointment request created");
  } catch (error) {
    showToast(error.message);
  }
}

async function updateAppointmentStatus(id, status) {
  try {
    const response = await apiRequest(`/appointments/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    state.data = response.data;
    saveData();
    renderShell();
    showToast(`Appointment ${status}`);
  } catch (error) {
    showToast(error.message);
  }
}

async function saveTreatment(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const appointmentId = form.get("appointmentId");
  const payload = {
    appointmentId,
    disease: form.get("disease").trim(),
    prescription: form.get("prescription").trim(),
    progress: form.get("progress").trim(),
  };

  try {
    const response = await apiRequest("/treatments", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    state.data = response.data;
    state.view = "doctor-bill";
    saveData();
    renderShell();
    showToast("Treatment history updated");
  } catch (error) {
    showToast(error.message);
  }
}

async function generateBill(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const appointmentId = form.get("appointmentId");
  const bill = {
    appointmentId,
    consultationFee: Number(form.get("consultationFee") || 0),
    medicineFee: Number(form.get("medicineFee") || 0),
    labFee: Number(form.get("labFee") || 0),
    otherFee: Number(form.get("otherFee") || 0),
    status: form.get("status"),
  };

  try {
    const response = await apiRequest("/bills", {
      method: "POST",
      body: JSON.stringify(bill),
    });
    state.data = response.data;
    saveData();
    renderShell();
    showToast("Bill generated");
  } catch (error) {
    showToast(error.message);
  }
}

function bindGlobalEvents() {
  elements.roleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.role = button.dataset.role;
      state.view = state.role === "patient" ? "patient-create" : "doctor-profile";
      saveData();
      renderShell();
    });
  });

  elements.patientSelect.addEventListener("change", (event) => {
    state.activePatientId = event.target.value;
    saveData();
    renderShell();
  });

  elements.doctorSelect.addEventListener("change", (event) => {
    state.activeDoctorId = event.target.value;
    saveData();
    renderShell();
  });

  elements.navList.addEventListener("click", (event) => {
    const button = event.target.closest(".nav-button");
    if (!button) return;
    state.view = button.dataset.view;
    saveData();
    renderShell();
  });

  elements.resetDemoBtn.addEventListener("click", async () => {
    if (!window.confirm("Reset all demo patients, appointments, treatments, and bills?")) return;
    try {
      const response = await apiRequest("/reset", { method: "POST" });
      state.data = response.data;
      state.role = "patient";
      state.view = "patient-create";
      state.activePatientId = state.data.patients[0]?.id || "";
      state.activeDoctorId = state.data.doctors[0]?.id || "";
      saveData();
      renderShell();
      showToast("Demo data reset");
    } catch (error) {
      showToast(error.message);
    }
  });
}

async function init() {
  try {
    await loadData();
    bindGlobalEvents();
    renderShell();
  } catch (error) {
    elements.pageTitle.textContent = "Backend unavailable";
    elements.viewRoot.innerHTML = emptyPanel(
      "Backend unavailable",
      "Start the backend server with npm start, then refresh this page.",
    );
    showToast(error.message);
  }
}

init();
