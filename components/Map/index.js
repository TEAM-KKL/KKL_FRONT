"use client";

import { useState, useRef } from "react";
import Script from "next/script";
import styles from "./index.module.css";

export default function MapPage() {
  const [map, setMap] = useState(null);
  const [searchAddress, setSearchAddress] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const markersRef = useRef([]);
  const infoWindowsRef = useRef([]);
  const currentLocationMarkerRef = useRef(null);
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  const naverClientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
  const naverClientSecret = process.env.NEXT_PUBLIC_NAVER_CLIENT_SECRET;

  const initMap = () => {
    if (!window.naver || !window.naver.maps) {
      console.error("naver 지도 객체가 없습니다.");
      return;
    }

    const mapOptions = {
      center: new window.naver.maps.LatLng(36.765104950533, 127.281200389603),
      zoom: 15,
    };

    const mapInstance = new window.naver.maps.Map("map", mapOptions);
    setMap(mapInstance);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("브라우저에서 위치 정보를 지원하지 않습니다.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCurrentLocation({ lat, lng });

        if (map) {
          const currentPosition = new window.naver.maps.LatLng(lat, lng);

          // 기존 현재 위치 마커 제거
          if (currentLocationMarkerRef.current) {
            currentLocationMarkerRef.current.setMap(null);
          }

          // 새로운 현재 위치 마커 생성
          const marker = new window.naver.maps.Marker({
            position: currentPosition,
            map: map,
            icon: {
              content: `<div style="background-color: #4285F4; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
              anchor: new window.naver.maps.Point(6, 6),
            },
          });

          currentLocationMarkerRef.current = marker;
          map.setCenter(currentPosition);
          map.setZoom(18);
        }
      },
      (error) => {
        console.error("위치 정보를 가져오는 중 오류 발생:", error);
        alert(
          "위치 정보를 가져올 수 없습니다. 위치 정보 접근 권한을 확인해주세요."
        );
      }
    );
  };

  const clearMarkers = () => {
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    infoWindowsRef.current = [];
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchAddress.trim()) {
      alert("검색어를 입력해주세요.");
      return;
    }

    try {
      const response = await fetch(
        `/api/search?query=${encodeURIComponent(searchAddress)}`
      );

      if (!response.ok) {
        throw new Error("지역 검색 API 요청 실패");
      }

      const data = await response.json();

      if (data.items && data.items.length === 0) {
        alert("검색 결과가 없습니다.");
        setSearchResults([]);
        clearMarkers();
        return;
      }

      setSearchResults(data.items);
      clearMarkers();

      const bounds = new window.naver.maps.LatLngBounds();

      data.items.forEach((item, index) => {
        let lat, lng;

        if (item.mapy && item.mapx) {
          lat = parseFloat(item.mapy) / 10000000;
          lng = parseFloat(item.mapx) / 10000000;

          if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
            console.error("잘못된 좌표:", item);
            return;
          }

          console.log(`항목 ${index} 변환된 좌표: ${lat}, ${lng}`);
        } else {
          console.error("좌표 정보가 없는 항목:", item);
          return;
        }

        const position = new window.naver.maps.LatLng(lat, lng);

        bounds.extend(position);

        const marker = new window.naver.maps.Marker({
          position,
          map,
          title: item.title.replace(/<[^>]*>?/g, ""),
        });

        const infoWindow = new window.naver.maps.InfoWindow({
          content: `
            <div class="${styles.infoWindow}">
              <div class="${styles.infoWindowTitle}">${item.title.replace(
            /<[^>]*>?/g,
            ""
          )}</div>
              <div class="${styles.infoWindowAddress}">${item.address}</div>
            </div>
          `,
        });

        marker.addListener("click", () => {
          infoWindowsRef.current.forEach((infowin) => infowin.close());
          infoWindow.open(map, marker);
        });

        markersRef.current.push(marker);
        infoWindowsRef.current.push(infoWindow);
      });

      map.fitBounds(bounds);
    } catch (error) {
      console.error("검색 중 오류 발생:", error);
      alert("검색 중 오류가 발생했습니다.");
    }
  };

  const handleListItemClick = (index) => {
    const marker = markersRef.current[index];
    const infoWindow = infoWindowsRef.current[index];

    if (marker && infoWindow && map) {
      try {
        const position = marker.getPosition();

        const lat = position.lat();
        const lng = position.lng();

        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          const convertedPosition = new window.naver.maps.LatLng(lat, lng);

          map.setCenter(convertedPosition);
          map.setZoom(18);

          infoWindowsRef.current.forEach((infowin) => infowin.close());
          infoWindow.open(map, marker);

          if (
            window.naver &&
            window.naver.maps &&
            window.naver.maps.Animation
          ) {
            marker.setAnimation(window.naver.maps.Animation.BOUNCE);
            setTimeout(() => {
              marker.setAnimation(null);
            }, 2100);
          }
        } else {
          console.error("유효하지 않은 좌표:", lat, lng);
          alert("위치 정보가 올바르지 않습니다.");
        }
      } catch (e) {
        console.error("지도 이동 중 오류:", e);
        alert("지도 이동 중 오류가 발생했습니다.");
      }
    } else {
      console.error("마커, 정보창 또는 지도가 없습니다:", {
        marker,
        infoWindow,
        map,
      });
    }
  };

  if (!clientId || !naverClientId || !naverClientSecret) {
    console.warn("환경변수가 설정되지 않았습니다.");
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
        <form className={styles.searchForm} onSubmit={handleSearch}>
          <input
            type="text"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            placeholder="주소 또는 건물명을 입력하세요"
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton}>
            검색
          </button>
        </form>
        <button
          className={styles.locationButton}
          onClick={getCurrentLocation}
          title="현재 위치로 이동"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
          </svg>
        </button>
        <div className={styles.resultsContainer}>
          <ul className={styles.resultsList}>
            {searchResults.map((item, index) => (
              <li
                key={index}
                className={styles.resultItem}
                onClick={() => handleListItemClick(index)}
              >
                <strong>{item.title.replace(/<[^>]*>?/g, "")}</strong>
                <br />
                {item.address}
              </li>
            ))}
          </ul>
        </div>
        <div id="map" className={styles.map}></div>
      </div>
    </>
  );
}
