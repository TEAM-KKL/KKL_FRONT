"use client";

import { useState } from "react";
import Script from "next/script";
import styles from "./index.module.css";

export default function MapPage() {
  const [map, setMap] = useState(null);
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  const initMap = () => {
    if (!window.naver || !window.naver.maps) {
      console.error("naver 지도 객체가 없습니다.");
      return;
    }

    const mapOptions = {
      //뷰어 초기좌표 한기대
      center: new window.naver.maps.LatLng(36.765104950533, 127.281200389603),
      zoom: 15,
    };

    const mapInstance = new window.naver.maps.Map("map", mapOptions);
    setMap(mapInstance);
  };

  if (!clientId) {
    console.warn("Naver 지도 Client ID가 설정되지 않았습니다.");
    return <p>지도 로딩 오류: 환경변수를 확인하세요.</p>;
  }

  return (
    <>
      <Script
        src={`https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`}
        strategy="afterInteractive"
        onLoad={initMap}
        id="naver-map-script"
      />
      <div className={styles.container}>
        <div id="map" className={styles.map}></div>
      </div>
    </>
  );
}
