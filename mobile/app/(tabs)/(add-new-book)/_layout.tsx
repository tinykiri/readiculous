import { Stack } from "expo-router";

const AddNewBookLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="add-new-book"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
};


export default AddNewBookLayout;