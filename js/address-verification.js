// Free address lookup using the public Photon geocoder (OpenStreetMap data)
// and map display using Leaflet/OpenStreetMap. No Google API key.
import L from "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/+esm";
export function createAddressVerifier({addressInput,zipInput,verifyButton,confirmButton,status,mapElement}) {
 let map=null,marker=null,matched=null,confirmed=null;
 const say=t=>status.textContent=t;
 const reset=()=>{matched=null;confirmed=null;confirmButton.hidden=true;confirmButton.disabled=false;confirmButton.textContent="Confirm delivery pin";mapElement.hidden=true;say("Address changed. Verify it again and confirm the map pin.");};
 addressInput.addEventListener("input",reset);zipInput.addEventListener("input",reset);
 verifyButton.addEventListener("click",async()=>{
  const street=addressInput.value.trim(),zip=zipInput.value.trim();
  if(!street||!/^\d{5}$/.test(zip)){say("Enter a street address and five-digit ZIP code first.");return;}
  verifyButton.disabled=true;confirmButton.hidden=true;matched=null;confirmed=null;say("Looking up this address in OpenStreetMap…");
  try{
   const query=encodeURIComponent(street+", "+zip+", Texas, United States");
   const url="https://photon.komoot.io/api/?q="+query+"&limit=5&lang=en";
   const response=await fetch(url,{headers:{Accept:"application/json"}});
   if(!response.ok)throw new Error("The free address lookup is temporarily unavailable. Please try again.");
   const payload=await response.json();
   const candidates=(payload?.features||[]).filter(f=>{
    const p=f.properties||{};
    return String(p.countrycode||"").toLowerCase()==="us" &&
      String(p.postcode||"").replace(/\D/g,"").slice(0,5)===zip &&
      (p.housenumber||"") && (p.street||p.name||"");
   });
   const hit=candidates[0];
   if(!hit)throw new Error("We couldn't find a matching street address in the map data. Check the house number, street and ZIP, then try again.");
   const [lon,lat]=hit.geometry.coordinates.map(Number),p=hit.properties;
   if(!Number.isFinite(lat)||!Number.isFinite(lon))throw new Error("The address service returned an invalid map location.");
   const formatted=[(p.housenumber+" "+(p.street||p.name)).trim(),p.city||p.locality,p.state,p.postcode,p.country].filter(Boolean).join(", ");
   matched={address_match:formatted,address_lat:lat,address_lon:lon};
   addressInput.value=formatted;mapElement.hidden=false;
   if(!map){map=L.map(mapElement,{scrollWheelZoom:false}).setView([lat,lon],17);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).addTo(map);marker=L.marker([lat,lon],{draggable:true}).addTo(map);marker.on("dragend",()=>{confirmed=null;confirmButton.disabled=false;confirmButton.hidden=false;say("Map pin moved. Confirm this delivery location to continue.");});}
   else{map.setView([lat,lon],17);marker.setLatLng([lat,lon]);}
   setTimeout(()=>map.invalidateSize(),100);confirmButton.hidden=false;say("Map match found: "+formatted+". Check the pin, move it if needed, then confirm.");
  }catch(error){say(error.message||"Address lookup failed.");}
  finally{verifyButton.disabled=false;}
 });
 confirmButton.addEventListener("click",()=>{if(!matched||!marker)return;const point=marker.getLatLng();confirmed={...matched,address_lat:Number(point.lat),address_lon:Number(point.lng),address_verified_at:new Date().toISOString()};say("Map pin confirmed. The location will be saved privately to your customer profile.");confirmButton.textContent="Pin confirmed";confirmButton.disabled=true;});
 return {getVerifiedAddress:()=>confirmed?{...confirmed}:null};
}