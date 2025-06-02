/* eslint-disable */

import dotenv from 'dotenv';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import * as maptilersdk from '@maptiler/sdk';

dotenv.config({ path: './config.env' });

export const displayMap = (locations) => {
  maptilersdk.config.apiKey = process.env.MAPTILER_TOKEN;

  const map = new maptilersdk.Map({
    container: 'map',
    style: maptilersdk.MapStyle.STREETS,
    scrollZoom: false,
  });

  const bounds = new maptilersdk.LngLatBounds();

  locations.forEach((loc) => {
    const el = document.createElement('div');
    el.className = 'marker';

    new maptilersdk.Marker({ element: el, anchor: 'bottom' })
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

  map.on('load', () => {
    if (locations.length > 0) {
      map.fitBounds(bounds, {
        padding: {
          top: 200,
          bottom: 150,
          left: 100,
          right: 100,
        },
        minZoom: 5,
        maxZoom: 9,
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
