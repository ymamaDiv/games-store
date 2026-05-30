console.log("SERVER FILE IS RUNNING..."); /*للتأكد من أن ملف الخادم يتم تشغيله بشكل صحيح. عند تشغيل هذا الملف، ستظهر هذه الرسالة في وحدة التحكم (Console) مما يشير إلى أن الخادم بدأ في العمل. هذا مفيد للتصحيح والتأكد من أن كل شيء يعمل كما هو متوقع قبل التعامل مع الطلبات الفعلية من العملاء.*/

const path = require("path"); /*للتعامل مع المسارات في النظام*/
const fs = require("fs"); /*للتعامل مع نظام الملفات، مثل إنشاء مجلدات أو قراءة الملفات. في هذا السياق، يستخدم لإنشاء مجلد "data" إذا لم يكن موجودًا بالفعل، وللتأكد من أن قاعدة البيانات يمكن تخزينها بشكل صحيح داخل هذا المجلد.*/
const express = require("express"); /*لإنشاء خادم ويب بسيط للتعامل مع طلبات HTTP. في هذا السياق، يستخدم لإنشاء خادم يستمع على منفذ معين ويعالج طلبات التسجيل وتسجيل الدخول من العملاء.*/
const cors = require("cors"); /*للسماح بالطلبات من مصادر مختلفة (Cross-Origin Resource Sharing). في هذا السياق، يستخدم للسماح لتطبيق الواجهة الأمامية (الذي قد يكون مستضافًا على نطاق مختلف) بالتواصل مع خادم الواجهة الخلفية دون مشاكل تتعلق بسياسة نفس الأصل (Same-Origin Policy).*/
const bcrypt = require("bcryptjs"); /*لتشفير كلمات المرور قبل تخزينها في قاعدة البيانات. في هذا السياق، يستخدم لتأمين كلمات المرور التي يقدمها المستخدمون أثناء التسجيل، مما يجعل من الصعب على أي شخص الوصول إلى كلمات المرور الحقيقية حتى إذا تم اختراق قاعدة البيانات.*/
const Database = require("better-sqlite3");    /*للتعامل مع قاعدة بيانات SQLite بطريقة سهلة وفعالة. في هذا السياق، يستخدم لإنشاء قاعدة بيانات جديدة (أو فتحها إذا كانت موجودة بالفعل) وتخزين معلومات المستخدمين مثل الاسم الكامل، البريد الإلكتروني، وكلمة المرور المشفرة. كما يستخدم لتنفيذ استعلامات SQL لإنشاء الجداول وإدراج البيانات واسترجاعها عند الحاجة.*/

const app = express(); /*لإنشاء خادم ويب بسيط للتعامل مع طلبات HTTP. في هذا السياق، يستخدم لإنشاء خادم يستمع على منفذ معين ويعالج طلبات التسجيل وتسجيل الدخول من العملاء.*/
// ===== CHANGE PORT HERE ONLY — then save, stop server (Ctrl+C), run npm start =====
const PORT = 3003;
// ==================================================================================

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, "users.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

app.post("/api/signup", (req, res) => {
  const { fullName, email, password, confirmPassword } = req.body;

  if (!fullName?.trim() || !email?.trim() || !password || !confirmPassword) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  if (!isValidEmail(email.trim())) {
    return res.status(400).json({ success: false, message: "Please enter a valid email address." });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters long.",
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: "Passwords do not match." });
  }

  try {
    const passwordHash = bcrypt.hashSync(password, 10);
    const insert = db.prepare(
      "INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)"
    );
    insert.run(fullName.trim(), email.trim().toLowerCase(), passwordHash);

    return res.status(201).json({
      success: true,
      message: "Account created successfully! You can sign in now.",
    });
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }
    console.error("Signup error:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
});

app.post("/api/signin", (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required." });
  }

  if (!isValidEmail(email.trim())) {
    return res.status(400).json({ success: false, message: "Please enter a valid email address." });
  }

  try {
    const user = db
      .prepare("SELECT id, full_name, email, password_hash FROM users WHERE email = ?")
      .get(email.trim().toLowerCase());

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    return res.json({
      success: true,
      message: "Signed in successfully.",
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Signin error:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`LUGX Store running at http://localhost:${PORT}`);
  console.log(`Open in browser: http://localhost:${PORT}/index.html`);
});
