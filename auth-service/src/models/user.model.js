const { default: mongoose } = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: [true, "El correo es obligatorio"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Correo inválido"],
  },
  password: {
    type: String,
    required: [true, "La contraseña es obligatoria"],
    minlength: [8, "La contraseña debe tener mínimo 8 caracteres"],
    match: [
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/,
      "La contraseña debe tener al menos una mayúscula, una minúscula, un número y un carácter especial",
    ],
  },
  phone: {
    type: String,
    required: [true, "El teléfono es obligatorio"],
    match: [/^\d{10}$/, "El teléfono debe tener 10 dígitos numéricos"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  active: {
    type: Boolean,
    required: true,
    default: true,
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    required: true,
  },
  photo: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.model("User", userSchema);
