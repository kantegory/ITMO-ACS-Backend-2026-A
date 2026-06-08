package org.rentservice.service.Photo;


import lombok.RequiredArgsConstructor;
import org.rentservice.data.entity.Photo;
import org.rentservice.data.entity.Realty;
import org.rentservice.data.mapper.PhotoMapper;
import org.rentservice.data.request.PhotoRequest;
import org.rentservice.data.response.PhotoResponse;
import org.rentservice.repository.PhotoRepository;
import org.rentservice.repository.RealtyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;


@Service
@RequiredArgsConstructor
@Transactional
public class PhotoServiceImpl implements PhotoService {

    private final PhotoRepository photoRepository;

    private final RealtyRepository realtyRepository;

    private final PhotoMapper photoMapper;




    @Override
    public PhotoResponse create(
            PhotoRequest request
    ) {

        Realty realty =
                realtyRepository.findById(
                                request.getRealtyId())
                        .orElseThrow();

        Photo photo = new Photo();

        photo.setOnwerRealty(realty);
        photo.setPath(request.getPath());

        return photoMapper.toResponse(
                photoRepository.save(photo)
        );
    }

    @Override
    public List<PhotoResponse> getByRealty(
            Long realtyId
    ) {

        return photoRepository
                .findByOnwerRealtyId(realtyId)
                .stream()
                .map(photoMapper::toResponse)
                .toList();
    }

    @Override
    public void delete(Long id) {

        photoRepository.deleteById(id);
    }
}


