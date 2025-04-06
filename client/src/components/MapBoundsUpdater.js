import { useMap } from 'react-leaflet';

const MapBoundsUpdater = ({ resources }) => {
  const map = useMap();

  useEffect(() => {
    if (resources && resources.length > 0) {
      const validLocations = resources.filter(
        res => res.latitude && res.longitude &&
        !isNaN(parseFloat(res.latitude)) &&
        !isNaN(parseFloat(res.longitude))
      );

      if (validLocations.length > 0) {
        const bounds = L.latLngBounds(
          validLocations.map(res => [
            parseFloat(res.latitude),
            parseFloat(res.longitude)
          ])
        );

        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }
    }
  }, [map, resources]);

  return null;
};
