import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext"; // Pastikan path ini benar
import { Camera, User, Mail, Save, X, Loader2 } from "lucide-react"; // Install lucide-react jika belum

const Profile = () => {
  const { user, updateProfile } = useAuth(); // Asumsi ada fungsi updateProfile di context

  // State untuk Mode Edit
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // State untuk Data Form
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
  });

  // State untuk Preview Foto
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Ref untuk input file (biar bisa trigger lewat tombol lain)
  const fileInputRef = useRef(null);

  // Load data user saat komponen di-mount
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        bio: user.bio || "Pengguna Chemical Discovery AI", // Default bio
      });
      setPreviewUrl(user.avatarUrl || null); // Asumsi user punya field avatarUrl
    }
  }, [user]);

  // Handle Perubahan Input Teks
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Pilih Foto
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Buat URL sementara untuk preview gambar
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  // Trigger klik input file hidden
  const handleAvatarClick = () => {
    if (isEditing) {
      fileInputRef.current.click();
    }
  };

  // Submit Data
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Kita gunakan FormData karena ada upload file (gambar)
      const dataToSend = new FormData();
      dataToSend.append("name", formData.name);
      dataToSend.append("bio", formData.bio);
      if (selectedFile) {
        dataToSend.append("avatar", selectedFile);
      }

      // Panggil fungsi update dari context (atau langsung API call di sini)
      // Contoh: await api.put('/user/profile', dataToSend);
      // Disini kita simulasi update lewat context:
      await updateProfile(dataToSend);

      setIsEditing(false);
      alert("Profil berhasil diperbarui!"); // Ganti dengan ToastNotification nanti
    } catch (error) {
      console.error("Gagal update profil:", error);
      alert("Terjadi kesalahan saat update profil.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Header Background (Banner) */}
        <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

        <div className="px-6 pb-8 relative">
          {/* Avatar Section */}
          <div className="relative -mt-16 mb-6 flex justify-center sm:justify-start">
            <div className="relative group">
              <div
                className={`w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden bg-gray-200 flex items-center justify-center ${
                  isEditing ? "cursor-pointer" : ""
                }`}
                onClick={handleAvatarClick}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={64} className="text-gray-400" />
                )}

                {/* Overlay Icon Kamera saat Edit Mode */}
                {isEditing && (
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white" size={24} />
                  </div>
                )}
              </div>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* Form Section */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              {isEditing ? "Edit Profil" : formData.name}
            </h1>
            <button
              onClick={() => {
                if (isEditing) {
                  // Cancel action: reset form
                  setIsEditing(false);
                  // Reset logic here if needed
                } else {
                  setIsEditing(true);
                }
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isEditing
                  ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {isEditing ? "Batal" : "Edit Profil"}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input Nama */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 dark:disabled:bg-gray-900"
                  />
                </div>
              </div>

              {/* Input Email (Biasanya Read-Only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled={true} // Email biasanya tidak boleh diganti sembarangan
                    className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-900 dark:border-gray-600 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Email tidak dapat diubah.
                </p>
              </div>
            </div>

            {/* Input Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bio / Deskripsi
              </label>
              <textarea
                name="bio"
                rows="4"
                value={formData.bio}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 dark:disabled:bg-gray-900"
                placeholder="Ceritakan sedikit tentang dirimu..."
              />
            </div>

            {/* Tombol Simpan (Hanya muncul saat Edit) */}
            {isEditing && (
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
