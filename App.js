import React from 'react'
import { Platform } from 'react-native'
import AppLoading from 'expo-app-loading'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  ApolloProvider,
  ApolloLink,
  concat,
  split
} from '@apollo/client'
import { getMainDefinition } from '@apollo/client/utilities'
import { WebSocketLink } from '@apollo/client/link/ws'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { ProvideAuth } from './components/context/useAuth'
import Router from './components/Router'

const httpLink = new HttpLink({
  // uri: __DEV__
  //   ? 'https://hero-journey-staging.herokuapp.com/graphql'
  //   : 'https://hero-journey-prod.herokuapp.com/graphql',
   uri: 'https://delivery-backend-staging.herokuapp.com/graphql', //active url
  //uri: 'http://localhost:5001/graphql',
  fetch
})

const authMiddleware = new ApolloLink(async (operation, forward) => {
  // add the authorization to the headers
  const token = await AsyncStorage.getItem('token')
  operation.setContext({
    headers: {
      authorization: token ? `Bearer ${token}` : null
    }
  })

  return forward(operation)
})

const wsLink = new WebSocketLink({
   uri: `ws://delivery-backend-staging.herokuapp.com/graphql`,
  //uri: `ws://localhost:5001/graphql`,
  options: {
    reconnect: true
  }
})

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    )
  },
  wsLink,
  concat(authMiddleware, httpLink)
)

const apolloClient = new ApolloClient({
  connectToDevTools: true,
  ssrMode: true,
  cache: new InMemoryCache(),
  link: splitLink
})

const App = () => {
  const [fontsLoaded] = useFonts({
    // eslint-disable-next-line prettier/prettier
    graphicLcgReg: require('./assets/fonts/GraphikLCG-Regular.ttf'),
    // eslint-disable-next-line prettier/prettier
    graphicLcgMedium: require('./assets/fonts/GraphikLCG-Medium.ttf'),
    // eslint-disable-next-line prettier/prettier
    graphicLcgSemiBold: require('./assets/fonts/GraphikLCG-Semibold.ttf')
  })

  React.useEffect(() => {
    if (Platform.OS === 'ios') {
      SplashScreen.hideAsync()
    }
  }, [])

  if (!fontsLoaded) {
    return <AppLoading />
  }

  return (
    <ApolloProvider client={apolloClient}>
      <ProvideAuth>
        <Router />
      </ProvideAuth>
    </ApolloProvider>
  )
}

export default App
