import { useState, useEffect } from "react";

const RangeSlider = ({
  label,
  min = 0,
  max = 1000,
  step = 1,
  value = [min, max],
  onChange,
  unit = "",
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleMinChange = (e) => {
    const newMin = Math.min(Number(e.target.value), localValue[1] - step);
    const newValue = [newMin, localValue[1]];
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleMaxChange = (e) => {
    const newMax = Math.max(Number(e.target.value), localValue[0] + step);
    const newValue = [localValue[0], newMax];
    setLocalValue(newValue);
    onChange(newValue);
  };

  const percentage = (val) => ((val - min) / (max - min)) * 100;

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
        {label}
      </label>

      {/* Value Display */}
      <div className="flex items-center justify-between text-sm">
        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300">
          {localValue[0]}
          {unit}
        </span>
        <span className="text-gray-400">—</span>
        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300">
          {localValue[1]}
          {unit}
        </span>
      </div>

      {/* Slider Track */}
      <div className="relative h-2">
        {/* Background Track */}
        <div className="absolute w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full" />

        {/* Active Track */}
        <div
          className="absolute h-2 bg-primary-500 rounded-full"
          style={{
            left: `${percentage(localValue[0])}%`,
            right: `${100 - percentage(localValue[1])}%`,
          }}
        />

        {/* Min Slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue[0]}
          onChange={handleMinChange}
          className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
        />

        {/* Max Slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue[1]}
          onChange={handleMaxChange}
          className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
        />
      </div>

      {/* Min/Max Labels */}
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
};

export default RangeSlider;
