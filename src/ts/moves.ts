import axios from 'axios';

const BASE_URL = 'https://pokeapi.co/api/v2/';

export default async function getAllPokemonMoveNames(): Promise<string[]> {
    const response = await axios.get(`${BASE_URL}move?limit=10000`);
    const data = response?.data;
    if (!data) {
        throw new Error('No data');
    }

    return data.results.map((result: { name: string; }) => result.name);
}
