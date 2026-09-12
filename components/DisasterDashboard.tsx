"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type { DisasterEvent, RegionFilter, TimeFilter } from "@/lib/types";
import { getDisasterIcon, getDisasterLabel } from "@/lib/disasterUtils";

const WorldMap = dynamic(() => import("./WorldMap"), { ssr: false });

const regionButtons: Array<{ key: RegionFilter; label: string }> = [
  { key: "world", label: "🌍 전 세계" },
  { key: "asia", label: "아시아" },
  { key: "europe", label: "유럽" },
  { key: "north-america", label: "북미" },
  { key: "south-america", label: "남미" },
  { key: "africa", label: "아프리카" },
  { key: "oceania", label: "오세아니아" },
];

function isInRegion(lat: number, lng: number, region: RegionFilter) {
  if (region === "world") return true;
  if (region === "europe") return lat >= 35 && lat <= 72 && lng >= -25 && lng <= 45;
  if (region === "africa") return lat >= -40 && lat <= 38 && lng >= -20 && lng <= 55;
  if (region === "oceania") return lat >= -50 && lat <= 10 && lng >= 110 && lng <= 180;
  if (region === "north-america") return lat >= 5 && lat <= 85 && lng >= -170 && lng <= -50;
  if (region === "south-america") return lat >= -60 && lat <= 15 && lng >= -90 && lng <= -30;
  return lat >= -10 && lat <= 80 && lng >= 25 && lng <= 180;
}

function searchAliases(event: DisasterEvent) {
  const aliases = {
    earthquake: "지진 earthquake",
    wildfire: "산불 wildfire fire",
    storm: "폭풍 태풍 허리케인 storm typhoon hurricane cyclone",
    volcano: "화산 volcano eruption",
    flood: "홍수 flood",
    other: "기타 other",
  }[event.type];
  return [event.title, event.source, event.countryNameKo, event.countryNameEn, aliases]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function timeAgo(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

function severityClass(score: number) {
  if (score >= 90) return "extreme";
  if (score >= 75) return "high";
  if (score >= 60) return "medium";
  return "low";
}

export default function DisasterDashboard() {
  const [events, setEvents] = useState<DisasterEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string>();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("24h");
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("world");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<DisasterEvent | null>(null);
  const [focusRequest, setFocusRequest] = useState(0);

  async function loadDisasters() {
    try {
      setError(null);
      const response = await fetch("/api/disasters", { cache: "no-store" });
      if (!response.ok) throw new Error("재난 데이터를 불러오지 못했습니다.");
      const data = await response.json();
      setEvents(data.events ?? []);
      setUpdatedAt(data.updatedAt);
    } catch (err) {
      console.error(err);
      setError("현재 자연재해 데이터를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDisasters();
    const timer = window.setInterval(loadDisasters, 60000);
    return () => window.clearInterval(timer);
  }, []);

  const filteredEvents = useMemo(() => {
    const now = Date.now();
    const query = searchQuery.trim().toLowerCase();
    const maxAge = timeFilter === "24h" ? 24 : timeFilter === "7d" ? 24 * 7 : 24 * 30;
    return events.filter((event) => {
      const hours = (now - new Date(event.time).getTime()) / 3600000;
      const timeMatch = hours <= maxAge;
      const regionMatch = isInRegion(event.latitude, event.longitude, regionFilter);
      const searchMatch = !query || searchAliases(event).includes(query);
      return timeMatch && regionMatch && searchMatch;
    });
  }, [events, timeFilter, regionFilter, searchQuery]);

  const counts = useMemo(() => ({
    all: filteredEvents.length,
    earthquake: filteredEvents.filter((e) => e.type === "earthquake").length,
    wildfire: filteredEvents.filter((e) => e.type === "wildfire").length,
    storm: filteredEvents.filter((e) => e.type === "storm").length,
    volcano: filteredEvents.filter((e) => e.type === "volcano").length,
    flood: filteredEvents.filter((e) => e.type === "flood").length,
  }), [filteredEvents]);

  const recent = [...filteredEvents].sort((a, b) => +new Date(b.time) - +new Date(a.time)).slice(0, 15);
  const top10 = [...filteredEvents].sort((a, b) => b.severity - a.severity).slice(0, 10);

  if (loading && events.length === 0) {
    return <StateShell title="자연재해 정보를 불러오는 중입니다" text="USGS와 NASA EONET 데이터를 확인하고 있습니다." loading />;
  }

  if (error && events.length === 0) {
    return <StateShell title="데이터를 불러오지 못했습니다" text={error} onRetry={() => { setLoading(true); loadDisasters(); }} />;
  }

  return (
    <main className="appShell">
      <header className="appHeader">
        <div className="brandArea">
          <div className="brandRow"><h1>WORLD NOW</h1><span className="liveBadge"><i /> LIVE</span></div>
          <p>전 세계 자연재해를 한눈에 보는 실시간 상황판</p>
        </div>
        <div className="headerInfo">
          <div><span>마지막 업데이트</span><strong>{updatedAt ? new Date(updatedAt).toLocaleString("ko-KR") : "-"}</strong></div>
          <div><span>데이터 출처</span><strong>USGS · NASA EONET</strong></div>
        </div>
      </header>

      {error && <div className="softError">⚠️ 새 데이터를 갱신하지 못했습니다. 기존 데이터를 표시 중입니다.</div>}

      <section className="controlCard">
        <div className="searchRow">
          <div className="searchBox"><span>🔎</span><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="지역 또는 재난 검색..." />{searchQuery && <button onClick={() => setSearchQuery("")}>×</button>}</div>
          <span className="resultCount">검색 결과 <b>{filteredEvents.length}</b>건</span>
        </div>
        <div className="filterLine"><span className="filterLabel">시간</span><div className="buttonRow">{(["24h", "7d", "30d"] as TimeFilter[]).map((item) => <button key={item} className={timeFilter === item ? "pill active" : "pill"} onClick={() => setTimeFilter(item)}>{item === "24h" ? "24시간" : item === "7d" ? "7일" : "30일"}</button>)}</div></div>
        <div className="filterLine"><span className="filterLabel">지역</span><div className="buttonRow scrollRow">{regionButtons.map((item) => <button key={item.key} className={regionFilter === item.key ? "pill active" : "pill"} onClick={() => setRegionFilter(item.key)}>{item.label}</button>)}</div></div>
      </section>

      <section className="statsGrid">
        <Stat label="전체" icon="🌍" value={counts.all} />
        <Stat label="지진" icon="🔴" value={counts.earthquake} />
        <Stat label="산불" icon="🔥" value={counts.wildfire} />
        <Stat label="폭풍" icon="🌪️" value={counts.storm} />
        <Stat label="화산" icon="🌋" value={counts.volcano} />
        <Stat label="홍수" icon="🌊" value={counts.flood} />
      </section>

      {filteredEvents.length === 0 ? (
        <div className="stateCard"><div className="stateIcon">🔎</div><h2>조건에 맞는 재난이 없습니다</h2><p>시간, 지역 또는 검색 조건을 변경해 보세요.</p></div>
      ) : (
        <>
          <div className="mainGrid">
            <WorldMap events={filteredEvents} selectedEvent={selectedEvent} onSelect={setSelectedEvent} focusRequest={focusRequest} />
            <DetailPanel event={selectedEvent} onClose={() => setSelectedEvent(null)} onFocus={() => setFocusRequest((v) => v + 1)} />
          </div>
          <div className="bottomGrid">
            <ListCard title="🚨 최근 자연재해" events={recent} onSelect={setSelectedEvent} />
            <TopCard events={top10} onSelect={setSelectedEvent} />
          </div>
        </>
      )}
      <footer className="footer">WORLD NOW · 실시간 데이터는 원본 기관의 갱신 주기에 따라 지연될 수 있습니다.</footer>
    </main>
  );
}

function Stat({ label, icon, value }: { label: string; icon: string; value: number }) {
  return <div className="statCard"><span>{icon} {label}</span><strong>{value}</strong></div>;
}

function DetailPanel({ event, onClose, onFocus }: { event: DisasterEvent | null; onClose: () => void; onFocus: () => void }) {
  if (!event) return <aside className="detailCard emptyDetail"><div>📍</div><h3>재난을 선택하세요</h3><p>지도 마커나 목록을 선택하면 상세정보가 표시됩니다.</p></aside>;
  return <aside className="detailCard">
    <div className="detailTop"><div><span className="eyebrow">DISASTER DETAIL</span><h3>{getDisasterIcon(event.type)} {getDisasterLabel(event.type)}</h3></div><button onClick={onClose}>×</button></div>
    <div className="countryLine">{event.countryFlag} {event.countryNameKo ?? "국가 미확인"}</div>
    <h2 className="detailTitle">{event.title}</h2>
    <div className={`severityBox ${severityClass(event.severity)}`}><span>위험도</span><strong>{event.severity}</strong><small>/100</small></div>
    <div className="detailList"><div><span>발생/업데이트</span><b>{new Date(event.time).toLocaleString("ko-KR")}</b></div><div><span>출처</span><b>{event.source}</b></div><div><span>위치</span><b>{event.latitude.toFixed(3)}, {event.longitude.toFixed(3)}</b></div>{event.magnitude !== undefined && <div><span>규모</span><b>M {event.magnitude.toFixed(1)}</b></div>}{event.depth !== undefined && <div><span>깊이</span><b>{event.depth.toFixed(1)} km</b></div>}</div>
    <button className="focusButton" onClick={onFocus}>📍 이 재난 위치 보기</button>
    {event.url && <a className="sourceLink" href={event.url} target="_blank" rel="noreferrer">공식 출처 열기 ↗</a>}
  </aside>;
}

function ListCard({ title, events, onSelect }: { title: string; events: DisasterEvent[]; onSelect: (event: DisasterEvent) => void }) {
  return <section className="listCard"><div className="sectionHeader"><h2>{title}</h2><span>{events.length}건</span></div><div className="eventList">{events.map((event) => <button key={event.id} className="eventRow" onClick={() => onSelect(event)}><span className="eventIcon">{getDisasterIcon(event.type)}</span><span className="eventMain"><small>{event.countryFlag} {event.countryNameKo ?? "국가 미확인"} · {getDisasterLabel(event.type)} · {timeAgo(event.time)}</small><b>{event.title}</b><em>{event.source}{event.magnitude !== undefined ? ` · M ${event.magnitude.toFixed(1)}` : ""}</em></span><span className={`miniScore ${severityClass(event.severity)}`}>{event.severity}</span></button>)}</div></section>;
}

function TopCard({ events, onSelect }: { events: DisasterEvent[]; onSelect: (event: DisasterEvent) => void }) {
  return <section className="listCard"><div className="sectionHeader"><h2>🔥 위험도 TOP 10</h2><span>WORLD NOW 점수</span></div><div className="eventList">{events.map((event, i) => <button key={event.id} className="topRow" onClick={() => onSelect(event)}><span className="rank">{i + 1}</span><span>{getDisasterIcon(event.type)}</span><span className="eventMain"><small>{event.countryFlag} {event.countryNameKo ?? "국가 미확인"}</small><b>{event.title}</b></span><strong className={severityClass(event.severity)}>{event.severity}</strong></button>)}</div></section>;
}

function StateShell({ title, text, loading, onRetry }: { title: string; text: string; loading?: boolean; onRetry?: () => void }) {
  return <main className="appShell"><header className="appHeader"><div className="brandArea"><div className="brandRow"><h1>WORLD NOW</h1><span className="liveBadge"><i /> LIVE</span></div><p>전 세계 자연재해를 한눈에 보는 실시간 상황판</p></div></header><div className="stateCard tall">{loading ? <div className="spinner" /> : <div className="stateIcon">⚠️</div>}<h2>{title}</h2><p>{text}</p>{onRetry && <button className="retryButton" onClick={onRetry}>↻ 다시 불러오기</button>}</div></main>;
}
