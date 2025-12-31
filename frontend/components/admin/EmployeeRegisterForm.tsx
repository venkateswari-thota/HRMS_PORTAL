'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Camera, AlertCircle, CheckCircle, X, Upload, FolderOpen } from 'lucide-react';

const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false, loading: () => <p className="text-white/50 animate-pulse">Loading Map Interface...</p> });

export default function EmployeeRegisterForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    personal_email: '',
    work_lat: 0,
    work_lng: 0,
    geofence_radius: 100,
    std_check_in: '09:00',
    std_check_out: '18:00',
  });

  const [faceImages, setFaceImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData(prev => ({ ...prev, work_lat: lat, work_lng: lng }));
  };

  const processFiles = (files: FileList | File[]) => {
    setUploadError('');
    const fileArray = Array.from(files);

    // Filter only image files
    const imageFiles = fileArray.filter(file =>
      file.type.match(/^image\/(jpeg|jpg|png|webp)$/)
    );

    // Validate count
    if (imageFiles.length < 3) {
      setUploadError('Please select at least 3 images');
      return;
    }
    if (imageFiles.length > 6) {
      setUploadError('Maximum 6 images allowed. Selecting first 6 images.');
      imageFiles.splice(6); // Keep only first 6
    }

    // Validate format and size
    const validFiles: File[] = [];
    const previews: string[] = [];

    for (const file of imageFiles) {
      // Check size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`File too large: ${file.name}. Max 5MB per image.`);
        return;
      }

      validFiles.push(file);
      previews.push(URL.createObjectURL(file));
    }

    setFaceImages(validFiles);
    setImagePreviews(previews);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    processFiles(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    const files: File[] = [];

    // Process dropped items (files or folders)
    for (let i = 0; i < items.length; i++) {
      const item = items[i].webkitGetAsEntry();
      if (item) {
        if (item.isFile) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        } else if (item.isDirectory) {
          // Read folder contents
          const folderFiles = await readDirectory(item as FileSystemDirectoryEntry);
          files.push(...folderFiles);
        }
      }
    }

    if (files.length > 0) {
      processFiles(files);
    }
  };

  // Recursive function to read folder contents
  const readDirectory = async (directory: FileSystemDirectoryEntry): Promise<File[]> => {
    const files: File[] = [];
    const reader = directory.createReader();

    return new Promise((resolve) => {
      const readEntries = () => {
        reader.readEntries(async (entries) => {
          if (entries.length === 0) {
            resolve(files);
            return;
          }

          for (const entry of entries) {
            if (entry.isFile) {
              const file = await new Promise<File>((res) => {
                (entry as FileSystemFileEntry).file(res);
              });
              files.push(file);
            } else if (entry.isDirectory) {
              const subFiles = await readDirectory(entry as FileSystemDirectoryEntry);
              files.push(...subFiles);
            }
          }

          readEntries(); // Continue reading
        });
      };

      readEntries();
    });
  };

  const removeImage = (index: number) => {
    setFaceImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate images
    if (faceImages.length < 3) {
      alert('Please upload at least 3 face images');
      return;
    }

    setLoading(true);
    try {
      // Create FormData
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('personal_email', formData.personal_email);
      formDataToSend.append('work_lat', formData.work_lat.toString());
      formDataToSend.append('work_lng', formData.work_lng.toString());
      formDataToSend.append('geofence_radius', formData.geofence_radius.toString());
      formDataToSend.append('std_check_in', formData.std_check_in);
      formDataToSend.append('std_check_out', formData.std_check_out);

      // Append all face images
      faceImages.forEach((file) => {
        formDataToSend.append('face_images', file);
      });

      // Send to backend
      const token = localStorage.getItem('admin_token') || '';
      const res = await fetch('http://localhost:8000/admin/employee/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Registration failed');
      }

      const result = await res.json();
      alert(`✅ Employee registered successfully!\n\nEmployee ID: ${result.emp_id}\nImages uploaded: ${result.images_uploaded}\n\nCredentials sent to ${formData.personal_email}`);

      // Reset form
      setFormData({
        name: '',
        email: '',
        personal_email: '',
        work_lat: 0,
        work_lng: 0,
        geofence_radius: 100,
        std_check_in: '09:00',
        std_check_out: '18:00',
      });
      setFaceImages([]);
      setImagePreviews([]);

    } catch (err: any) {
      alert("❌ Registration Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none text-gray-900";

  return (
    <div className="bg-white p-6 border border-gray-200 shadow-xl rounded-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
      <h2 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
        Register New Employee
      </h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</label>
          <input
            className={`${inputClass} focus:ring-blue-500/50`}
            placeholder="e.g. John Doe"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Org Email</label>
          <input
            className={`${inputClass} focus:ring-blue-500/50`}
            placeholder="john@company.com"
            type="email"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Personal Email</label>
          <input
            className={`${inputClass} focus:ring-purple-500/50`}
            placeholder="john.doe@gmail.com"
            type="email"
            value={formData.personal_email}
            onChange={e => setFormData({ ...formData, personal_email: e.target.value })}
            required
          />
        </div>

        <div className="col-span-2 space-y-2">
          <div className="flex justify-between items-end">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Work Location (Geo-fencing)</label>
            <span className="text-xs text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded border border-blue-100">
              {formData.work_lat.toFixed(5)}, {formData.work_lng.toFixed(5)}
            </span>
          </div>
          <div className="h-72 rounded-xl overflow-hidden border border-gray-300 shadow-inner">
            <MapPicker onSelect={handleLocationSelect} />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Geofence Radius (Meters)</label>
          <input
            type="number"
            className={inputClass}
            value={formData.geofence_radius}
            onChange={e => setFormData({ ...formData, geofence_radius: parseFloat(e.target.value) })}
          />
        </div>

        {/* Face Images Upload Section */}
        <div className="col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-blue-600" />
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Face Images</label>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold text-blue-900">📸 Upload Guidelines:</p>
            <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
              <li><strong>Quantity:</strong> Minimum 3 images, Maximum 6 images</li>
              <li><strong>Format:</strong> JPG, PNG, or WEBP only</li>
              <li><strong>Size:</strong> Maximum 5MB per image</li>
              <li><strong>Quality:</strong> Clear, well-lit face photos</li>
              <li><strong>Variety:</strong> Different angles (front, slight left, slight right)</li>
              <li><strong>Expression:</strong> Mix of neutral and smiling faces</li>
              <li><strong>No accessories:</strong> Remove sunglasses, masks, or hats</li>
            </ul>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('folder-input')?.click()}
            className={`
              relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer
              ${isDragging
                ? 'border-blue-500 bg-blue-50 scale-105'
                : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50'
              }
            `}
          >
            <div className="flex flex-col items-center gap-4 text-center pointer-events-none">
              {isDragging ? (
                <>
                  <Upload className="w-12 h-12 text-blue-600 animate-bounce" />
                  <p className="text-lg font-semibold text-blue-600">Drop folder here!</p>
                </>
              ) : (
                <>
                  <FolderOpen className="w-12 h-12 text-gray-400" />
                  <div>
                    <p className="text-base font-semibold text-gray-700 mb-1">
                      Drag & Drop Employee Photo Folder
                    </p>
                    <p className="text-sm text-gray-500">
                      or click to browse
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Hidden Folder Input */}
          <input
            id="folder-input"
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            className="hidden"
          />

          {/* Alternative: Traditional File Button */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-xs text-gray-500 uppercase">Or select files manually</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          <label className="block">
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
            />
          </label>

          {/* Error Message */}
          {uploadError && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{uploadError}</span>
            </div>
          )}

          {/* Success Message */}
          {faceImages.length >= 3 && !uploadError && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{faceImages.length} images selected ✓</span>
            </div>
          )}

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-6 gap-3">
              {imagePreviews.map((preview, i) => (
                <div key={i} className="relative group">
                  <img
                    src={preview}
                    alt={`Face ${i + 1}`}
                    className="w-full h-24 rounded-lg border-2 border-gray-200 object-cover shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <span className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                    {i + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Shift Start</label>
          <input type="time" className={inputClass} value={formData.std_check_in} onChange={e => setFormData({ ...formData, std_check_in: e.target.value })} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Shift End</label>
          <input type="time" className={inputClass} value={formData.std_check_out} onChange={e => setFormData({ ...formData, std_check_out: e.target.value })} />
        </div>

        <div className="col-span-2 pt-4">
          <button
            type="submit"
            disabled={loading || faceImages.length < 3}
            className="btn-primary w-full flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Uploading to AWS S3...' : '✨ Create Employee Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
