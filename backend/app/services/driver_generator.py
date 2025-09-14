"""
Driver Generation Service
Generates random driver accounts using location data from CSV file
"""
import pandas as pd
import random
from typing import List, Dict, Tuple
import asyncio
import logging
from pathlib import Path
from datetime import datetime

from app.core.config import settings

logger = logging.getLogger(__name__)


class DriverGeneratorService:
    """Service for generating and managing random driver accounts"""

    def __init__(self):
        self.drivers: List[Dict] = []
        self.location_data: pd.DataFrame = None
        self.driver_update_interval = settings.driver_update_interval

    async def initialize_drivers(self):
        """Initialize driver generation service"""
        try:
            await self.load_location_data()
            await self.generate_drivers(settings.default_driver_count)
            logger.info(f"✅ Generated {len(self.drivers)} drivers")

            # Start periodic driver location updates
            asyncio.create_task(self._periodic_driver_updates())

        except Exception as e:
            logger.error(f"Failed to initialize driver generator: {e}")
            # Generate fallback drivers without location data
            await self.generate_fallback_drivers(settings.default_driver_count)

    async def load_location_data(self):
        """Load location data from CSV file"""
        try:
            file_path = Path(settings.geo_data_file)

            # If file doesn't exist in expected location, try current directory
            if not file_path.exists():
                file_path = Path("/app/geo_locations_astana_hackathon")
                if not file_path.exists():
                    file_path = Path("./geo_locations_astana_hackathon")

            if file_path.exists():
                logger.info(f"Loading location data from {file_path}")

                # Load CSV with proper data types
                self.location_data = pd.read_csv(file_path, dtype={
                    'randomized_id': str,
                    'lat': float,
                    'lng': float,
                    'alt': float,
                    'spd': float,
                    'azm': float
                })

                # Filter for reasonable locations (remove outliers)
                self.location_data = self.location_data[
                    (self.location_data['lat'].between(51.0, 52.0)) &
                    (self.location_data['lng'].between(71.0, 72.0))
                ]

                logger.info(f"Loaded {len(self.location_data)} location records")
            else:
                logger.warning(f"Location data file not found at {file_path}")
                raise FileNotFoundError(f"Location data file not found: {file_path}")

        except Exception as e:
            logger.error(f"Error loading location data: {e}")
            raise

    async def generate_drivers(self, count: int = 10):
        """Generate random driver accounts"""
        if self.location_data is None or len(self.location_data) == 0:
            logger.warning("No location data available, generating fallback drivers")
            await self.generate_fallback_drivers(count)
            return

        self.drivers = []

        # Sample random locations from the dataset
        sampled_locations = self.location_data.sample(n=min(count, len(self.location_data)), random_state=42)

        driver_names = [
            "Aibek", "Daulet", "Erlan", "Farid", "Gulnar", "Halil", "Ilyas", "Jasmin", "Kairat", "Laila",
            "Madina", "Nazar", "Omar", "Patima", "Qasim", "Raisa", "Sultan", "Tahir", "Ulpan", "Viktor"
        ]

        vehicle_types = ["sedan", "SUV", "hatchback", "coupe", "wagon"]
        license_prefixes = ["KZ", "AST", "ALA", "KAR", "PAV"]

        for i, (_, location) in enumerate(sampled_locations.iterrows()):
            driver_id = f"driver_{random.randint(1000, 9999)}"

            driver = {
                "driverId": driver_id,
                "name": f"{random.choice(driver_names)} {chr(65 + (i % 26))}",
                "location": {
                    "lat": float(location['lat']),
                    "lng": float(location['lng']),
                    "alt": float(location.get('alt', 0)),
                    "spd": float(location.get('spd', 0)),
                    "azm": float(location.get('azm', 0))
                },
                "vehicleType": random.choice(vehicle_types),
                "licensePlate": f"{random.choice(license_prefixes)}{random.randint(100, 999)}{chr(65 + random.randint(0, 25))}{chr(65 + random.randint(0, 25))}",
                "rating": round(random.uniform(4.0, 5.0), 1),
                "status": "online" if random.random() > 0.3 else "offline",  # 70% online
                "lastUpdate": datetime.utcnow().isoformat(),
                "totalRides": random.randint(50, 500),
                "earnings": random.randint(5000, 50000)
            }

            self.drivers.append(driver)
            logger.debug(f"Generated driver: {driver['name']} at ({driver['location']['lat']:.4f}, {driver['location']['lng']:.4f})")

    async def generate_fallback_drivers(self, count: int = 10):
        """Generate fallback drivers without location data"""
        logger.info("Generating fallback drivers without location data")

        self.drivers = []

        driver_names = [
            "Aibek", "Daulet", "Erlan", "Farid", "Gulnar", "Halil", "Ilyas", "Jasmin", "Kairat", "Laila",
            "Madina", "Nazar", "Omar", "Patima", "Qasim", "Raisa", "Sultan", "Tahir", "Ulpan", "Viktor"
        ]

        vehicle_types = ["sedan", "SUV", "hatchback", "coupe", "wagon"]
        license_prefixes = ["KZ", "AST", "ALA", "KAR", "PAV"]

        # Astana center coordinates as fallback
        base_lat, base_lng = 51.1694, 71.4491

        for i in range(count):
            # Add some random offset from center
            lat_offset = random.uniform(-0.05, 0.05)
            lng_offset = random.uniform(-0.05, 0.05)

            driver = {
                "driverId": f"driver_{random.randint(1000, 9999)}",
                "name": f"{random.choice(driver_names)} {chr(65 + (i % 26))}",
                "location": {
                    "lat": base_lat + lat_offset,
                    "lng": base_lng + lng_offset,
                    "alt": 0,
                    "spd": 0,
                    "azm": 0
                },
                "vehicleType": random.choice(vehicle_types),
                "licensePlate": f"{random.choice(license_prefixes)}{random.randint(100, 999)}{chr(65 + random.randint(0, 25))}{chr(65 + random.randint(0, 25))}",
                "rating": round(random.uniform(4.0, 5.0), 1),
                "status": "online" if random.random() > 0.3 else "offline",
                "lastUpdate": datetime.utcnow().isoformat(),
                "totalRides": random.randint(50, 500),
                "earnings": random.randint(5000, 50000)
            }

            self.drivers.append(driver)
            logger.debug(f"Generated fallback driver: {driver['name']}")

    async def _periodic_driver_updates(self):
        """Periodically update driver locations and status"""
        while True:
            try:
                await self.update_driver_locations()
                await asyncio.sleep(self.driver_update_interval)
            except Exception as e:
                logger.error(f"Error in driver update cycle: {e}")
                await asyncio.sleep(60)  # Wait longer on error

    async def update_driver_locations(self):
        """Update driver locations with small random movements"""
        for driver in self.drivers:
            if driver["status"] == "online":
                # Add small random movement (simulate GPS drift)
                lat_change = random.uniform(-0.001, 0.001)
                lng_change = random.uniform(-0.001, 0.001)

                driver["location"]["lat"] += lat_change
                driver["location"]["lng"] += lng_change

                # Update speed and azimuth randomly
                driver["location"]["spd"] = random.uniform(0, 60)  # 0-60 km/h
                driver["location"]["azm"] = random.uniform(0, 360)  # 0-360 degrees

                driver["lastUpdate"] = datetime.utcnow().isoformat()

        logger.debug(f"Updated locations for {len([d for d in self.drivers if d['status'] == 'online'])} online drivers")

    def get_online_drivers(self) -> List[Dict]:
        """Get list of online drivers"""
        return [driver for driver in self.drivers if driver["status"] == "online"]

    def get_driver_by_id(self, driver_id: str) -> Dict | None:
        """Get driver by ID"""
        return next((driver for driver in self.drivers if driver["driverId"] == driver_id), None)

    def set_driver_status(self, driver_id: str, status: str):
        """Update driver status"""
        driver = self.get_driver_by_id(driver_id)
        if driver:
            driver["status"] = status
            driver["lastUpdate"] = datetime.utcnow().isoformat()
            logger.info(f"Driver {driver_id} status updated to {status}")

    def get_random_location_from_data(self) -> Tuple[float, float]:
        """Get a random location from the loaded data"""
        if self.location_data is not None and len(self.location_data) > 0:
            random_row = self.location_data.sample(n=1).iloc[0]
            return float(random_row['lat']), float(random_row['lng'])

        # Fallback to Astana center
        return 51.1694, 71.4491

    async def add_new_driver(self) -> Dict:
        """Add a new random driver"""
        if self.location_data is not None:
            await self.generate_drivers(1)
        else:
            await self.generate_fallback_drivers(1)

        new_driver = self.drivers[-1]
        logger.info(f"Added new driver: {new_driver['name']}")
        return new_driver

    def get_stats(self) -> Dict:
        """Get driver generation statistics"""
        online_count = len(self.get_online_drivers())
        return {
            "total_drivers": len(self.drivers),
            "online_drivers": online_count,
            "offline_drivers": len(self.drivers) - online_count,
            "location_data_loaded": self.location_data is not None,
            "location_records": len(self.location_data) if self.location_data is not None else 0
        }
