import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
    //http://34.28.246.100:4001/graphql
    uri: process.env.REACT_APP_API_URL || 'http://34.9.138.238:4000/graphql',
});

const authLink = setContext((_, { headers }) => {
    // Si tienes autenticación, puedes agregar el token aquí
    return {
        headers: {
            ...headers,
            // authorization: token ? `Bearer ${token}` : "",
        }
    };
});

const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
});

export default client;