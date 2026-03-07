// Inside AuthNavigator.js
const MainTabs = () => (
  <Tab.Navigator screenOptions={{ headerShown: false }}>
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="My Pets" component={PetListScreen} />
  </Tab.Navigator>
);
