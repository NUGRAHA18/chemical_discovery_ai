import React, { useState, useEffect } from "react";
import axios from "axios"; // Atau pakai instance axios kamu
import { User, Mail, Camera, Save, Building, FileText } from "lucide-react";

const Profile = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // State Form
  const [formData, setFormData] = useState({
    username: "",
    email: "", // Email biasanya read-only
    bio: "",
    institution: "",
    avatar: null,
  });

  // State untuk Preview Gambar
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Ambil data user saat load (Asumsi ada endpoint /api/auth/me)
  useEffect(() => {
    // Ganti dengan logic fetch user kamu yang sebenarnya
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:3000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = res.data; // Sesuaikan struktur response backend

        setFormData({
          username: user.username || "",
          email: user.email || "",
          bio: user.bio || "",
          institution: user.institution || "",
          avatar: user.avatar, // URL dari backend
        });

        // Set preview jika user sudah punya avatar
        if (user.avatar) {
          // Tambahkan base URL jika avatar hanya menyimpan relative path '/uploads/...'
          setAvatarPreview(`http://localhost:3000${user.avatar}`);
        }
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };

    fetchUser();
  }, []);

  // Handle Input Text
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle File Upload (Gambar)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 1. Simpan file asli ke state (untuk dikirim ke backend)
      setFormData({ ...formData, avatar: file });

      // 2. Buat URL sementara untuk preview (agar user lihat apa yang mereka pilih)
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("token");

      // PENTING: Gunakan FormData untuk mengirim file + text
      const dataPayload = new FormData();
      dataPayload.append("username", formData.username);
      dataPayload.append("bio", formData.bio);
      dataPayload.append("institution", formData.institution);

      // Hanya append avatar jika user mengupload file baru (object File)
      // Jika formData.avatar masih berupa string (URL lama), jangan kirim ulang
      if (formData.avatar instanceof File) {
        dataPayload.append("avatar", formData.avatar);
      }

      const res = await axios.put(
        "http://localhost:3000/api/auth/profile",
        dataPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data", // Header wajib untuk upload file
          },
        }
      );

      setMessage({ type: "success", text: "Profile updated successfully!" });

      // Update local storage user data jika perlu
      // localStorage.setItem('user', JSON.stringify(res.data.user));
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to update profile." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Researcher Profile
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* KOLOM KIRI: FOTO PROFIL */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 dark:border-gray-700 shadow-inner bg-gray-200">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <User size={48} />
                  </div>
                )}
              </div>

              {/* Overlay Edit Button */}
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg cursor-pointer transition-colors"
              >
                <Camera size={18} />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            </div>

            <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white text-center">
              {formData.username || "User"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              {formData.institution || "No Institution"}
            </p>
          </div>
        </div>

        {/* KOLOM KANAN: FORM EDIT */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            {message && (
              <div
                className={`mb-4 p-4 rounded-lg text-sm ${
                  message.type === "success"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-3 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-transparent dark:text-white"
                  />
                </div>
              </div>

              {/* Email (Read Only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative opacity-60">
                  <Mail
                    className="absolute left-3 top-3 text-gray-400"
                    size={18}
                  />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed directly.
                </p>
              </div>

              {/* Institution */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Institution / Company
                </label>
                <div className="relative">
                  <Building
                    className="absolute left-3 top-3 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    name="institution"
                    value={formData.institution}
                    onChange={handleChange}
                    placeholder="e.g. Pertamina Research Lab"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-transparent dark:text-white"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <div className="relative">
                  <FileText
                    className="absolute left-3 top-3 text-gray-400"
                    size={18}
                  />
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Tell us about your research focus..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-transparent dark:text-white"
                  ></textarea>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save size={18} /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
