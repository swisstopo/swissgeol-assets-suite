export type LayerStyle<T> = {
  point: {
    pointInstance: T;
    lineInstance: T;
    polygonInstance: T;
  };
  line: T;
  polygon: T;
};
