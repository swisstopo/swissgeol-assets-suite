import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AssetId } from '@asset-sg/shared/v2';
import { FavoritesService } from './favorites.service';

describe(FavoritesService, () => {
  let service: FavoritesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FavoritesService],
    });

    service = TestBed.inject(FavoritesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Ensure that there are no outstanding requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should retrieve favorites from API via GET', () => {
    const ids: Array<AssetId> = [234, 34, 29];

    service.fetchIds().subscribe((favorites) => {
      expect(favorites.length).toBe(3);
      expect(favorites).toEqual(ids);
    });

    const request = httpMock.expectOne(`/api/assets/favorites/ids`);
    expect(request.request.method).toBe('GET');
    request.flush(ids);
  });
});
