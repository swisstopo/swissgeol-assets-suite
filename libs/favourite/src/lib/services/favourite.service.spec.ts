import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Favourite, FavouriteService } from './favourite.service';

describe('FavouriteService', () => {
  let service: FavouriteService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FavouriteService],
    });

    service = TestBed.inject(FavouriteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Ensure that there are no outstanding requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should retrieve favourites from API via GET', () => {
    const dummyFavourites: Favourite[] = [{}, {}, {}];

    service.getFavourites().subscribe((favourites) => {
      expect(favourites.length).toBe(3);
      expect(favourites).toEqual(dummyFavourites);
    });

    const request = httpMock.expectOne(`/api/user/favourite`);
    expect(request.request.method).toBe('GET');
    request.flush(dummyFavourites);
  });
});
