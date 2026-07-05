import React from 'react';
import { View, Text } from 'react-native';

export const App: React.FC = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>ZIII Living</Text>
      <Text style={{ fontSize: 16, color: '#666' }}>Mobile App (Resident &amp; Guard)</Text>
      <Text style={{ fontSize: 12, color: '#999', marginTop: 16 }}>🚧 Under construction</Text>
    </View>
  );
};

export default App;
