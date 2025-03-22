export class Game {
  id: number;
  title: string;
  genre: string;
  numberOfPlayers: string;
  recommendedAge: string;
  playTime: string;
  components: string[];
  description: string;
  releaseYear?: number;
  image?: string | undefined;

  constructor(
    id: number,
    title: string,
    genre: string,
    numberOfPlayers: string,
    recommendedAge: string,
    playTime: string,
    components: string[],
    description: string,
    releaseYear?: number,
    image?: string,
  ) {
    this.id = id;
    this.title = title;
    this.genre = genre;
    this.numberOfPlayers = numberOfPlayers;
    this.recommendedAge = recommendedAge;
    this.playTime = playTime;
    this.components = components;
    this.description = description;
    this.releaseYear = releaseYear ?? 0; // Default to 0 if undefined
    this.image = image;
  }

  static fromJSON(json: {
    id?: number;
    title: string;
    genre: string;
    numberOfPlayers: string;
    recommendedAge: string;
    playTime: string;
    components: string[];
    description: string;
    releaseYear?: number;
    image?: string;
  }): Game {
    return new Game(
      json.id || Date.now(), // Generate ID if not provided
      json.title,
      json.genre,
      json.numberOfPlayers,
      json.recommendedAge,
      json.playTime,
      json.components,
      json.description,
      json.releaseYear,
      json.image,
    );
  }
}
