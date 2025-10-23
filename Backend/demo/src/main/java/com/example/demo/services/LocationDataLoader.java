package com.example.demo.services;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.example.demo.model.Location;
import com.example.demo.repository.LocationRepository;

@Component
public class LocationDataLoader implements CommandLineRunner{
    private final LocationRepository locationRepository;

    public LocationDataLoader(LocationRepository locationRepository) {
        this.locationRepository = locationRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (locationRepository.count() == 0) {
            loadLocationData();
        }
    }

    private void loadLocationData() {
        List<Location> locations = List.of(
            new Location("AG", "An Giang"),
            new Location("BN", "Bắc Ninh"),
            new Location("CM", "Cà Mau"),
            new Location("CB", "Cao Bằng"),
            new Location("CT", "Cần Thơ"),
            new Location("ĐNa", "Đà Nẵng"),
            new Location("ĐL", "Đắk Lắk"),
            new Location("ĐB", "Điện Biên"),
            new Location("ĐN", "Đồng Nai"),
            new Location("ĐT", "Đồng Tháp"),
            new Location("GL", "Gia Lai"),
            new Location("HN", "Hà Nội"),
            new Location("HT", "Hà Tĩnh"),
            new Location("HP", "Hải Phòng"),
            new Location("SG", "Thành phố Hồ Chí Minh"),
            new Location("TTH", "Huế"),
            new Location("HY", "Hưng Yên"),
            new Location("KH", "Khánh Hòa"),
            new Location("LC", "Lai Châu"),
            new Location("LS", "Lạng Sơn"),
            new Location("LCa", "Lào Cai"),
            new Location("LĐ", "Lâm Đồng"),
            new Location("NA", "Nghệ An"),
            new Location("NB", "Ninh Bình"),
            new Location("PT", "Phú Thọ"),
            new Location("QNg", "Quảng Ngãi"),
            new Location("QN", "Quảng Ninh"),
            new Location("QT", "Quảng Trị"),
            new Location("SL", "Sơn La"),
            new Location("TN", "Tây Ninh"),
            new Location("TNg", "Thái Nguyên"),
            new Location("TH", "Thanh Hóa"),
            new Location("TQ", "Tuyên Quang"),
            new Location("VL", "Vĩnh Long")
        );
        
        locationRepository.saveAll(locations);

        System.out.println("Inserted " + locations.size() + " locations to the database");
    }
}
