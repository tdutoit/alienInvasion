
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { City } from '../types';

interface GlobeProps {
  cities: City[];
  onCityClick: (cityId: string) => void;
  timeScale: number;
  activeCityId: string | null;
  saucerCount: number;
  humanReadiness: number;
  lastFiringEvent: { cityId: string; timestamp: number } | null;
}

const CameraHandler: React.FC<{ 
  activeCityId: string | null; 
  cityMarkers: any[]; 
  earthRef: React.RefObject<THREE.Mesh>;
}> = ({ activeCityId, cityMarkers, earthRef }) => {
  const { camera, controls } = useThree() as any;
  const [isTransitioningToCenter, setIsTransitioningToCenter] = useState(false);
  const [isInitialZoomToCity, setIsInitialZoomToCity] = useState(false);
  
  const lastActiveCityId = useRef<string | null>(activeCityId);
  const worldPos = useMemo(() => new THREE.Vector3(), []);
  const center = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useEffect(() => {
    if (activeCityId !== lastActiveCityId.current) {
      if (activeCityId) {
        setIsInitialZoomToCity(true);
        setIsTransitioningToCenter(false);
      } else {
        setIsInitialZoomToCity(false);
        setIsTransitioningToCenter(true);
      }
      lastActiveCityId.current = activeCityId;
    }
  }, [activeCityId]);

  useFrame(() => {
    if (!controls || !earthRef.current) return;

    if (activeCityId) {
      const city = cityMarkers.find(c => c.id === activeCityId);
      if (city) {
        worldPos.copy(city.pos);
        earthRef.current.localToWorld(worldPos);
        controls.target.lerp(worldPos, 0.1);

        if (isInitialZoomToCity) {
          const direction = worldPos.clone().normalize();
          const targetCamPos = worldPos.clone().add(direction.multiplyScalar(0.55));
          camera.position.lerp(targetCamPos, 0.06);

          if (camera.position.distanceTo(targetCamPos) < 0.005) {
            setIsInitialZoomToCity(false);
          }
        }
      }
    } else if (isTransitioningToCenter) {
      controls.target.lerp(center, 0.08);
      if (controls.target.distanceTo(center) < 0.001) {
        setIsTransitioningToCenter(false);
      }
    }
    controls.update();
  });

  return null;
};

const Saucer: React.FC<{ 
  id: number; 
  moonRef: React.RefObject<THREE.Mesh>; 
  birthTime: number; 
  orbitParams: { 
    distance: number; 
    inclination: THREE.Euler; 
    speed: number; 
    phaseOffset: number; 
  } 
}> = ({ moonRef, birthTime, orbitParams }) => {
  const meshRef = useRef<THREE.Group>(null);
  const tempMoonPos = useMemo(() => new THREE.Vector3(), []);
  const DEPLOY_DURATION = 4;

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const age = time - birthTime;
    if (!meshRef.current || !moonRef.current) return;

    const orbitAngle = (time * orbitParams.speed) + orbitParams.phaseOffset;
    const orbitPos = new THREE.Vector3(
      Math.cos(orbitAngle) * orbitParams.distance,
      Math.sin(orbitAngle) * orbitParams.distance,
      0
    );
    orbitPos.applyEuler(orbitParams.inclination);

    if (age < DEPLOY_DURATION) {
      moonRef.current.getWorldPosition(tempMoonPos);
      const progress = age / DEPLOY_DURATION;
      const t = progress * progress * (3 - 2 * progress); // smoothstep
      meshRef.current.position.lerpVectors(tempMoonPos, orbitPos, t);
      meshRef.current.lookAt(0, 0, 0);
      meshRef.current.scale.setScalar(0.2 + 0.8 * t);
    } else {
      meshRef.current.position.copy(orbitPos);
      meshRef.current.lookAt(0, 0, 0);
      meshRef.current.scale.setScalar(1);
    }
  });

  return (
    <group ref={meshRef}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.009, 24]} />
        <meshStandardMaterial color="#1a1a1a" metalness={1} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0, 0.006]}>
        <sphereGeometry args={[0.007, 8, 8]} />
        <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={4} />
      </mesh>
    </group>
  );
};

const SaucerSwarm: React.FC<{ saucerCount: number; moonRef: React.RefObject<THREE.Mesh> }> = ({ saucerCount, moonRef }) => {
  const [saucers, setSaucers] = useState<{ id: number; birthTime: number; params: any }[]>([]);
  const { clock } = useThree();

  useEffect(() => {
    if (saucerCount !== saucers.length) {
      if (saucerCount > saucers.length) {
        const needed = saucerCount - saucers.length;
        const newSaucers = Array.from({ length: needed }).map((_, i) => ({
          id: Date.now() + i,
          birthTime: clock.getElapsedTime(),
          params: {
            distance: 1.12 + Math.random() * 0.4,
            inclination: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
            speed: 0.12 + Math.random() * 0.15,
            phaseOffset: Math.random() * Math.PI * 2
          }
        }));
        setSaucers(prev => [...prev, ...newSaucers]);
      } else {
        setSaucers(prev => {
          const toRemove = prev.length - saucerCount;
          const next = [...prev];
          for(let i=0; i<toRemove; i++) {
             next.splice(Math.floor(Math.random() * next.length), 1);
          }
          return next;
        });
      }
    }
  }, [saucerCount, clock, saucers.length]);

  return <group>{saucers.map(s => <Saucer key={s.id} id={s.id} moonRef={moonRef} birthTime={s.birthTime} orbitParams={s.params} />)}</group>;
};

const MissileEffect: React.FC<{ startPos: THREE.Vector3 }> = ({ startPos }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [dead, setDead] = useState(false);
  const targetPos = useMemo(() => {
    const dir = startPos.clone().normalize();
    dir.x += (Math.random() - 0.5) * 1.5;
    dir.y += (Math.random() - 0.5) * 1.5;
    dir.z += (Math.random() - 0.5) * 1.5;
    dir.normalize().multiplyScalar(1.5 + Math.random() * 0.5);
    return dir;
  }, [startPos]);

  useFrame(() => {
    if (!groupRef.current || dead) return;
    groupRef.current.position.lerp(targetPos, 0.12);
    groupRef.current.lookAt(targetPos);
    if (groupRef.current.position.distanceTo(targetPos) < 0.05) setDead(true);
  });

  if (dead) {
    return (
      <mesh position={targetPos.toArray()}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.9} />
      </mesh>
    );
  }

  return (
    <group ref={groupRef} position={startPos.toArray()}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.06]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.01, 0.15, 8]} />
        <meshBasicMaterial color="#ff5500" transparent opacity={0.8} />
      </mesh>
    </group>
  );
};

const SAMBattery: React.FC<{ index: number; count: number; active: boolean; isHidden: boolean }> = ({ index, count, active, isHidden }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const pulse = 0.5 + Math.sin(clock.getElapsedTime() * 15 + index) * 0.5;
      meshRef.current.material.opacity = active ? (0.9 + pulse * 0.1) : (isHidden ? 0.35 : 0.6);
      meshRef.current.scale.setScalar(active ? (1.1 + pulse * 0.3) : 1);
    }
  });
  return (
    <mesh ref={meshRef} position={[(index - (count-1)/2) * 0.015, 0, 0]}>
      <boxGeometry args={[0.01, 0.02, 0.01]} />
      <meshBasicMaterial color={active ? "#ff1100" : (isHidden ? "#440000" : "#880000")} transparent />
    </mesh>
  );
};

const Globe: React.FC<GlobeProps> = ({ cities, onCityClick, timeScale, activeCityId, saucerCount, humanReadiness, lastFiringEvent }) => {
  const earthRef = useRef<THREE.Mesh>(null);
  const moonRef = useRef<THREE.Mesh>(null);
  const moonOrbitRef = useRef<THREE.Group>(null);
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [activeMissiles, setActiveMissiles] = useState<{ id: number; pos: THREE.Vector3 }[]>([]);

  const [earthMap, earthNormal, earthSpecular, moonMap] = useLoader(THREE.TextureLoader, [
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg',
  ]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime() * timeScale;
    if (earthRef.current) earthRef.current.rotation.y = time * 0.04;
    if (moonOrbitRef.current) moonOrbitRef.current.rotation.y = time * 0.08;
  });

  const cityMarkers = useMemo(() => {
    return cities.map((city) => {
      const phi = (90 - city.lat) * (Math.PI / 180);
      const theta = (city.lng + 180) * (Math.PI / 180);
      const x = -(1.0 * Math.sin(phi) * Math.cos(theta));
      const z = (1.0 * Math.sin(phi) * Math.sin(theta));
      const y = (1.0 * Math.cos(phi));
      return { ...city, pos: new THREE.Vector3(x, y, z) };
    });
  }, [cities]);

  useEffect(() => {
    if (lastFiringEvent) {
      const city = cityMarkers.find(c => c.id === lastFiringEvent.cityId);
      if (city && earthRef.current) {
        const worldPos = city.pos.clone();
        earthRef.current.localToWorld(worldPos);
        setActiveMissiles(prev => [...prev, { id: lastFiringEvent.timestamp, pos: worldPos }]);
        // Keep missiles longer for better visual trail effect
        setTimeout(() => setActiveMissiles(prev => prev.filter(m => m.id !== lastFiringEvent.timestamp)), 2000);
      }
    }
  }, [lastFiringEvent, cityMarkers]);

  return (
    <>
      <Stars radius={300} depth={50} count={15000} factor={6} saturation={0} fade speed={1} />
      <CameraHandler activeCityId={activeCityId} cityMarkers={cityMarkers} earthRef={earthRef} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[15, 10, 10]} intensity={2.2} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#0055ff" />
      
      <mesh ref={earthRef} onPointerDown={(e) => e.stopPropagation()}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial map={earthMap} normalMap={earthNormal} specularMap={earthSpecular} shininess={8} />
        {cityMarkers.map((city) => {
          const isActive = city.id === activeCityId;
          const isHovered = city.id === hoveredCity;
          const isVisible = city.status !== 'hidden';
          
          // Check if this city is currently firing
          const isFiring = lastFiringEvent?.cityId === city.id && (Date.now() - lastFiringEvent.timestamp < 1000);

          return (
            <group key={city.id} position={city.pos.toArray()}>
              <mesh onPointerDown={(e) => { e.stopPropagation(); onCityClick(city.id); }} onPointerOver={() => setHoveredCity(city.id)} onPointerOut={() => setHoveredCity(null)}>
                <sphereGeometry args={[0.016, 16, 16]} />
                <meshBasicMaterial color={isActive ? '#ff1100' : isVisible ? (city.status === 'scouted' ? '#00ffee' : '#ffcc00') : '#333'} />
              </mesh>
              {city.samSites > 0 && (
                <group position={[0, 0.022, 0]}>
                  {Array.from({ length: city.samSites }).map((_, i) => (
                    <SAMBattery key={i} index={i} count={city.samSites} active={isFiring} isHidden={!isVisible} />
                  ))}
                </group>
              )}
              {(isActive || isHovered) && (
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.022, 0.028, 32]} />
                  <meshBasicMaterial color={isActive ? '#ff0000' : '#00ffee'} transparent opacity={0.7} />
                </mesh>
              )}
            </group>
          );
        })}
      </mesh>
      
      <SaucerSwarm saucerCount={saucerCount} moonRef={moonRef} />
      {activeMissiles.map(m => <MissileEffect key={m.id} startPos={m.pos} />)}
      
      <group ref={moonOrbitRef}>
        <mesh ref={moonRef} position={[2.6, 0, 0]}>
          <sphereGeometry args={[0.27, 32, 32]} />
          <meshPhongMaterial map={moonMap} shininess={0} />
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.28, 32, 32]} />
            <meshBasicMaterial color="#00ffcc" transparent opacity={0.05} />
          </mesh>
        </mesh>
      </group>
    </>
  );
};

export default Globe;
