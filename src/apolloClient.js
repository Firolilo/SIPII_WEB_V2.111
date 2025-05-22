// src/apolloClient.js
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
    uri: process.env.REACT_APP_API_URL || 'http://localhost:4000/graphql',
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