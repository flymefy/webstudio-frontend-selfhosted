"use client";

import FlightSearchEngine from '../../../../components/flight-list/flight-list-v1/FlightSearchEngine';

export default function PKfareSearch() {
  // Reuse existing flight search UI; parent route can handle results/navigation
  return (
    <div className="container layout-pt-lg layout-pb-lg">
      <FlightSearchEngine onSearch={() => {}} loading={false} />
    </div>
  );
}