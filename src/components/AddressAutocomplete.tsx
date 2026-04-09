import React, { useEffect } from 'react';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    className={cn(
      'w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pami-cyan focus:border-transparent transition-all',
      className
    )}
    {...props}
  />
);

interface AddressAutocompleteProps {
  defaultValue?: string;
  onAddressSelect: (address: string, locality: string) => void;
  isLoaded: boolean;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({ 
  defaultValue = "", 
  onAddressSelect,
  isLoaded 
}) => {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      // Restringir a Argentina y preferir resultados cerca de La Plata/City Bell
      componentRestrictions: { country: "ar" },
      locationBias: { lat: -34.8717, lng: -58.0517, radius: 10000 } as any,
    },
    debounce: 300,
    defaultValue
  });

  useEffect(() => {
    if (defaultValue) {
      setValue(defaultValue, false);
    }
  }, [defaultValue, setValue]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleSelect = async (suggestion: google.maps.places.AutocompletePrediction) => {
    const { description } = suggestion;
    setValue(description, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address: description });
      
      // Extraer dirección y localidad
      let streetNumber = "";
      let route = "";
      let locality = "";

      results[0].address_components.forEach((component) => {
        const types = component.types;
        if (types.includes("street_number")) streetNumber = component.long_name;
        if (types.includes("route")) route = component.long_name;
        if (types.includes("locality")) locality = component.long_name;
        // Fallback para localidad si no hay 'locality'
        if (!locality && types.includes("administrative_area_level_2")) {
          locality = component.long_name;
        }
      });

      const fullAddress = streetNumber ? `${route} ${streetNumber}` : route;
      onAddressSelect(fullAddress || description, locality);
    } catch (error) {
      console.error("Error fetching geocode:", error);
      onAddressSelect(description, "");
    }
  };

  if (!isLoaded) {
    return <Input name="direccion" defaultValue={defaultValue} placeholder="Cargando mapa..." disabled />;
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <Input
          name="direccion"
          value={value}
          onChange={handleInput}
          disabled={!ready}
          placeholder="Empieza a escribir la dirección..."
          className="pr-10"
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-pami-muted">
          {!ready ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
        </div>
      </div>

      {status === "OK" && (
        <ul className="absolute z-50 w-full bg-white mt-1 border border-gray-200 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {data.map((suggestion) => {
            const {
              place_id,
              structured_formatting: { main_text, secondary_text },
            } = suggestion;

            return (
              <li
                key={place_id}
                onClick={() => handleSelect(suggestion)}
                className="px-4 py-3 hover:bg-pami-blue/5 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="mt-0.5 text-pami-blue shrink-0" />
                  <div>
                    <strong className="text-sm text-pami-text block">{main_text}</strong>
                    <small className="text-[11px] text-pami-muted block">{secondary_text}</small>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
