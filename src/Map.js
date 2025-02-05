import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const customIcon = new L.Icon({
  iconUrl: '/marker-icon.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const Map = () => {
  const [guessResult, setGuessResult] = useState(null);
  const [animalPolygon, setAnimalPolygon] = useState(null);
  const [userGuess, setUserGuess] = useState(null);

  useEffect(() => {
    fetch('/Varanus_albigularis.geojson')
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (!data.features || !data.features[0]?.geometry?.coordinates) throw new Error('Invalid GeoJSON structure');
        const polygonCoordinates = data.features[0].geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
        setAnimalPolygon(polygonCoordinates);
      })
      .catch(error => console.error('Error fetching animal data:', error));
  }, []);

  // Function to check if a point is inside a polygon
  const isPointInsidePolygon = (point, polygon) => {
    if (!polygon) return false;
    let inside = false;
    const [x, y] = point;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];

      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }

    return inside;
  };

  // Component inside <MapContainer> to handle clicks
  const GuessHandler = () => {
    useMapEvents({
      click(e) {
        const guess = [e.latlng.lat, e.latlng.lng];
        setUserGuess(guess);
        const isOverlap = isPointInsidePolygon(guess, animalPolygon);
        setGuessResult(isOverlap ? 'Correct!' : 'Incorrect!');
      },
    });

    return null; // This component does not render anything
  };

  return (
    <div>
      <MapContainer center={[0, 0]} zoom={2} style={{ height: '500px', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {animalPolygon && <Polygon positions={animalPolygon} />}
        {userGuess && (
          <Marker position={userGuess} icon={customIcon}>
            <Popup>Your Guess</Popup>
          </Marker>
        )}
        <GuessHandler />
      </MapContainer>
      {guessResult && <p>{guessResult}</p>}
    </div>
  );
};

export default Map;
