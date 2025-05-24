/* eslint-disable */

import '@maptiler/sdk/dist/maptiler-sdk.css';
import * as maptilersdk from '@maptiler/sdk';

export const displayMap = (locations) => {
  maptilersdk.config.apiKey = '';

  const map = new maptilersdk.Map({
    container: 'map',
    style: maptilersdk.MapStyle.STREETS,
    scrollZoom: false,
  });

  const bounds = new maptilersdk.LngLatBounds();

  locations.forEach((loc) => {
    const el = document.createElement('div');
    el.className = 'marker';

    new maptilersdk.Marker({ element: el })
      .setLngLat(loc.coordinates)
      .addTo(map);

    new maptilersdk.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    bounds.extend(loc.coordinates);
  });

  // map.fitBounds(bounds, {
  //   padding: {
  //     top: 200,
  //     bottom: 150,
  //     left: 100,
  //     right: 100,
  //   },
  //   minZoom: 8,
  //   maxZoom: 14,
  // });

  map.on('load', () => {
    if (locations.length > 0) {
      map.fitBounds(bounds, {
        padding: {
          top: 200,
          bottom: 150,
          left: 100,
          right: 100,
        },
        minZoom: 1,
        maxZoom: 5,
      });
    } else {
      map.fitBounds(bounds, {
        padding: {
          top: 200,
          bottom: 150,
          left: 100,
          right: 100,
        },
      });
    }
  });
};
