// Free US Census address matching and OpenStreetMap map confirmation. No Google API key.
import L from "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/+esm";
export function createAddressVerifier({addressInput,zipInput,verifyButton,confirmButton,status,mapElement}) {
 let map=null,marker=null,matched=null,confirmed=null;
 const say=t=>status.textContent=t;
 const reset=()=>{matched=null;confirmed=null;confirmButton.hidden=true;confirmButton.disabled=false;confirmButton.textContent="Confirm delivery pin";mapElement.hidden=true;say("Address changed. Verify it again and confirm the map pin.");};
 addressInput.addEventListener("input",reset);zipInput.addEventListener("input",reset);
 verifyButton.addEventListener("click",async()=>{
  const street=addressInput.value.trim(),zip=zipInput.value.trim();
  if(!street||!/^\d{5}$/.test(zip)){say("Enter a street address and five-digit ZIP code first.");return;}
  verifyButton.disabled=true;confirmButton.hidden=true;matched=null;confirmed=null;say("Checking this address with the US Census Geocoder…");
  try{
   const query=encodeURIComponent(street+", "+zip+", Texas");
   const url="https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address="+query+"&benchmark=Public_AR_Current&format=json";
   const response=await fetch(url,{headers:{Accept:"application/json"}});
   if(!response.ok)throw new Error("The free address service is temporarily unavailable. Please try again.");
   const payload=await response.json(),hit=payload?.result?.addressMatches?.[0];
   if(!hit?.coordinates||!hit?.matchedAddress)throw new Error("We couldn't match that street address. Check the street number, city and ZIP, then try again.");
   const lat=Number(hit.coordinates.y),lon=Number(hit.coordinates.x);
   if(!Number.isFinite(lat)||!Number.isFinite(lon))throw new Error("The address service returned an invalid map location.");
   const zipMatch=hit.matchedAddress.match(/\b(\d{5})(?:-\d{4})?\b/);if(zipMatch)zipInput.value=zipMatch[1];
   matched={address_match:hit.matchedAddress,address_lat:lat,address_lon:lon};
   addressInput.value=hit.matchedAddress;
   mapElement.hidden=false;
   if(!map){map=L.map(mapElement,{scrollWheelZoom:false}).setView([lat,lon],16);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).addTo(map);marker=L.marker([lat,lon],{draggable:true}).addTo(map);marker.on("dragend",()=>{confirmed=null;confirmButton.disabled=false;confirmButton.hidden=false;say("Map pin moved. Confirm this delivery location to continue.");});}
   else{map.setView([lat,lon],16);marker.setLatLng([lat,lon]);}
   setTimeout(()=>map.invalidateSize(),100);confirmButton.hidden=false;say("Address matched: "+hit.matchedAddress+". Check the map pin, move it if needed, then confirm.");
  }catch(error){say(error.message||"Address verification failed.");}
  finally{verifyButton.disabled=false;}
 });
 confirmButton.addEventListener("click",()=>{if(!matched||!marker)return;const p=marker.getLatLng();confirmed={...matched,address_lat:Number(p.lat),address_lon:Number(p.lng),address_verified_at:new Date().toISOString()};say("Delivery pin confirmed. This location will be saved privately to your customer profile.");confirmButton.textContent="Pin confirmed";confirmButton.disabled=true;});
 return {getVerifiedAddress:()=>confirmed?{...confirmed}:null};
}