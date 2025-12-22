"use client";

import { useState, useMemo } from "react";
import { countries, type Country } from "@/lib/constants/countries";

interface CountrySelectorProps {
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
}

export function CountrySelector({
  value,
  onChange,
  placeholder = "Select a country",
}: CountrySelectorProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredCountries = useMemo(() => {
    if (!search) return countries;
    const lower = search.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.code.toLowerCase().includes(lower)
    );
  }, [search]);

  const selectedCountry = countries.find((c) => c.code === value);

  const handleSelect = (country: Country) => {
    onChange(country.code);
    setSearch("");
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border-4 border-black bg-white px-4 py-3 text-left font-bold shadow-brutal transition-all hover:shadow-none hover:translate-y-0.5"
      >
        {selectedCountry ? (
          <span>
            {selectedCountry.flag} {selectedCountry.name}
          </span>
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full border-4 border-black bg-white shadow-brutal">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search countries..."
            className="w-full border-b-4 border-black px-4 py-2 outline-none"
            autoFocus
          />
          <div className="max-h-60 overflow-y-auto">
            {filteredCountries.length === 0 ? (
              <div className="px-4 py-3 text-gray-500">No countries found</div>
            ) : (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleSelect(country)}
                  className={`w-full px-4 py-2 text-left transition-colors hover:bg-gray-100 ${
                    value === country.code ? "bg-black text-white hover:bg-gray-800" : ""
                  }`}
                >
                  {country.flag} {country.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
