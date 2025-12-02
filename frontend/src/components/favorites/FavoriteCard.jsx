import { useState } from "react";
import { API_BASE_URL } from "../../utils/constants";

const FavoriteCard = ({ favorite, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(favorite.notes || "");
  const [tags, setTags] = useState(favorite.tags?.join(", ") || "");

  const handleSave = () => {
    const tagsArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    onUpdate(favorite._id, { notes, tags: tagsArray });
    setIsEditing(false);
  };

  const { compoundData } = favorite;

  return (
    <div className="card hover:shadow-xl transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            {compoundData.name}
          </h3>
          <p className="text-sm text-gray-600">{compoundData.formula}</p>
        </div>
      </div>

      {/* Structure Image */}
      {compoundData.structure_image && (
        <div className="mb-4 bg-gray-50 rounded-lg p-4 flex justify-center">
          <img
            src={`${API_BASE_URL}${compoundData.structure_image}`}
            alt={compoundData.name}
            className="max-w-full h-auto"
            onError={(e) => (e.target.style.display = "none")}
          />
        </div>
      )}

      {/* Properties */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-primary-50 rounded-lg p-3">
          <p className="text-xs text-primary-600 font-medium">MW</p>
          <p className="text-lg font-bold text-primary-900">
            {compoundData.molecular_weight
              ? `${compoundData.molecular_weight} g/mol`
              : "N/A"}
          </p>
        </div>
        <div className="bg-secondary-50 rounded-lg p-3">
          <p className="text-xs text-secondary-600 font-medium">LogP</p>
          <p className="text-lg font-bold text-secondary-900">
            {compoundData.logp !== null && compoundData.logp !== undefined
              ? compoundData.logp.toFixed(2)
              : "N/A"}
          </p>
        </div>
      </div>

      {/* Tags */}
      <div className="mb-4">
        {isEditing ? (
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags (comma separated)"
            className="input-field text-sm"
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {favorite.tags?.map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="mb-4">
        {isEditing ? (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes..."
            rows="3"
            className="input-field resize-none text-sm"
          />
        ) : (
          <p className="text-sm text-gray-600 italic">
            {favorite.notes || "No notes"}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        {isEditing ? (
          <>
            <button onClick={handleSave} className="btn-primary flex-1 text-sm">
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="btn-outline flex-1 text-sm"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="btn-outline flex-1 text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(favorite._id)}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default FavoriteCard;
