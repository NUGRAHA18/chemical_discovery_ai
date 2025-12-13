import { useState, useEffect } from "react";
import {
  User,
  Building,
  FileText,
  Lock,
  Camera,
  Trash2,
  Save,
  Mail,
  Shield,
  Loader2,
} from "lucide-react";
import { showSuccess, showError } from "../utils/toast";
import Loading from "../components/common/Loading";
const API_BASE_URL = process.env.REACT_APP_API_URL;

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return path;
};

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    company: "",
    bio: "",
    profilePhoto: null,
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setProfile(data.user);
      }
    } catch (error) {
      showError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profile.name,
          company: profile.company,
          bio: profile.bio,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setProfile(data.user);

        // Update localStorage user
        const storedUser = JSON.parse(localStorage.getItem("user"));
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...storedUser,
            name: data.user.name,
            company: data.user.company,
            bio: data.user.bio,
          })
        );

        showSuccess("Profile updated successfully!");
      } else {
        showError(data.error || "Failed to update profile");
      }
    } catch (error) {
      showError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showError("Photo size must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      showError("Please upload an image file");
      return;
    }

    setUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/profile/photo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setProfile((prev) => ({
          ...prev,
          profilePhoto: data.profilePhoto,
        }));

        const storedUser = JSON.parse(localStorage.getItem("user"));
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...storedUser,
            profilePhoto: data.profilePhoto,
          })
        );

        showSuccess("Profile photo updated!");
        window.dispatchEvent(new Event("profilePhotoUpdated"));
      } else {
        showError(data.error || "Failed to upload photo");
      }
    } catch (error) {
      showError("Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!window.confirm("Are you sure you want to delete your profile photo?"))
      return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/profile/photo`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setProfile((prev) => ({
          ...prev,
          profilePhoto: null,
        }));

        const storedUser = JSON.parse(localStorage.getItem("user"));
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...storedUser,
            profilePhoto: null,
          })
        );

        showSuccess("Profile photo deleted");
        window.dispatchEvent(new Event("profilePhotoUpdated"));
      } else {
        showError(data.error || "Failed to delete photo");
      }
    } catch (error) {
      showError("Failed to delete photo");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (
      !passwords.currentPassword ||
      !passwords.newPassword ||
      !passwords.confirmPassword
    ) {
      showError("All password fields are required");
      return;
    }

    if (passwords.newPassword.length < 8) {
      showError("New password must be at least 8 characters");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      showError("New passwords do not match");
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/profile/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showSuccess("Password changed successfully!");
        setPasswords({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setShowPasswordSection(false);
      } else {
        showError(data.error || "Failed to change password");
      }
    } catch (error) {
      showError("Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  // --- STYLES ---
  const cardClass =
    "bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden";
  const labelClass =
    "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";
  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors";
  const btnPrimaryClass =
    "inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed";
  const btnSecondaryClass =
    "inline-flex items-center justify-center px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors";

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Container Konten tetap dibatasi lebarnya */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Account Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Manage your profile details and security preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: Identity Card (Photo & Email) */}
          <div className="lg:col-span-4 space-y-6">
            <div
              className={`${cardClass} p-6 flex flex-col items-center text-center`}
            >
              <div className="relative group mb-4">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-lg relative">
                  {profile.profilePhoto ? (
                    <img
                      src={
                        getImageUrl(profile.profilePhoto) ||
                        "/default-avatar.png"
                      }
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                      {profile.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}

                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                </div>

                <label
                  htmlFor="photo-upload"
                  className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg cursor-pointer hover:bg-blue-700 transition-colors"
                  title="Change Photo"
                >
                  <Camera className="w-4 h-4" />
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {profile.name || "User Name"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 break-all">
                {profile.email}
              </p>

              {profile.profilePhoto && (
                <button
                  onClick={handleDeletePhoto}
                  disabled={uploadingPhoto}
                  className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1 py-1 px-3 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Remove Photo
                </button>
              )}
            </div>

            {/* Read Only Email Info styled nicely */}
            <div className={`${cardClass} p-5`}>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-400" />
                Account Info
              </h3>
              <div>
                <label className={labelClass}>Email Address</label>
                <div className="flex items-center w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 cursor-not-allowed">
                  <Mail className="w-4 h-4 mr-2 opacity-70" />
                  {profile.email}
                </div>
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Managed by administrator
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Forms */}
          <div className="lg:col-span-8 space-y-6">
            {/* Personal Info Form */}
            <form
              onSubmit={handleUpdateProfile}
              className={`${cardClass} p-6 md:p-8`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" />
                  Personal Details
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <label className={labelClass}>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={profile.name || ""}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className={labelClass}>
                    <Building className="w-3.5 h-3.5 inline mr-1.5 opacity-70" />
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={profile.company || ""}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="e.g. Tech Corp"
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className={labelClass}>
                    <FileText className="w-3.5 h-3.5 inline mr-1.5 opacity-70" />
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={profile.bio || ""}
                    onChange={handleInputChange}
                    className={`${inputClass} min-h-[120px] resize-y`}
                    placeholder="Share a little bit about yourself..."
                    maxLength={500}
                  />
                  <div className="flex justify-end mt-1">
                    <span className="text-xs text-gray-400">
                      {profile.bio?.length || 0}/500
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className={btnPrimaryClass}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Security Section */}
            <div className={`${cardClass} p-6 md:p-8`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-blue-500" />
                  Password & Security
                </h2>
              </div>

              {!showPasswordSection ? (
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Change Password
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Update your password to keep your account secure
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPasswordSection(true)}
                    className={btnSecondaryClass}
                  >
                    Update
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleChangePassword}
                  className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-300"
                >
                  <div>
                    <label className={labelClass}>Current Password</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwords.currentPassword}
                      onChange={handlePasswordChange}
                      className={inputClass}
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={labelClass}>New Password</label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwords.newPassword}
                        onChange={handlePasswordChange}
                        className={inputClass}
                        placeholder="Min 8 chars"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Confirm Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwords.confirmPassword}
                        onChange={handlePasswordChange}
                        className={inputClass}
                        placeholder="Re-type new password"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordSection(false);
                        setPasswords({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        });
                      }}
                      className={btnSecondaryClass}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className={btnPrimaryClass}
                    >
                      {saving ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
