"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import styles from "./index.module.css";

export default function MapPage() {
  const [map, setMap] = useState(null);
  const [searchAddress, setSearchAddress] = useState("");
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

  const handleSearch = (e) => {
    e.preventDefault();
    if (
      !searchAddress ||
      !map ||
      !window.naver ||
      !window.naver.maps ||
      !window.naver.maps.Service
    ) {
      console.error("검색 준비 안됨");
      alert("지도 또는 검색 기능이 아직 준비되지 않았습니다.");
      return;
    }

    window.naver.maps.Service.geocode(
      {
        query: searchAddress,
      },
      (status, response) => {
        if (status !== window.naver.maps.Service.Status.OK) {
          console.error("Geocoding 실패:", status, response);
          return alert("주소 검색에 실패했습니다. 다시 시도해주세요.");
        }

        if (response.v2.addresses.length === 0) {
          return alert("검색 결과가 없습니다.");
        }

        const result = response.v2.addresses[0];
        const point = new window.naver.maps.Point(result.x, result.y);
        map.setCenter(point);
        // Optionally, add a marker
        // new window.naver.maps.Marker({
        //   position: point,
        //   map: map,
        // });
      }
    );
  };

  if (!clientId) {
    console.warn("Naver 지도 Client ID가 설정되지 않았습니다.");
    return <p>지도 로딩 오류: 환경변수를 확인하세요.</p>;
  }

  return (
    <>
      <Script
        src={`https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&submodules=geocoder`}
        strategy="afterInteractive"
        onLoad={initMap}
        id="naver-map-script"
      />
      <div className={styles.container}>
        <form className={styles.searchForm} onSubmit={handleSearch}>
          <input
            type="text"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            placeholder="주소를 입력하세요"
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton}>
            검색
          </button>
        </form>
        <div id="map" className={styles.map}></div>
      </div>
    </>
  );
}
