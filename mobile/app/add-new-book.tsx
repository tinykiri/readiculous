import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ScrollView, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { addNewBook } from '@/api/user-books';
import { Controller, useForm } from 'react-hook-form';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Book } from '@/src/types';
import { IconSymbol } from '@/components/ui/IconSymbol';
import StarRating from '@/components/ui/StarRating';
import RotatingLoader from '@/components/ui/RotatingLoader';
import { useAuth } from '@/src/contexts/AuthContext';
import { decode } from 'base64-arraybuffer';
import RNPickerSelect from "react-native-picker-select";
import { listOfLanguages } from '../constants/list-of-languages';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

const bookSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Title is required").max(100),
  author: z.string().min(1, "Author is required").max(100),
  rating: z.number().min(1).max(5),
  comment_section: z.string(),
  started_at: z.date(),
  finished_at: z.date(),
  photo_url: z.string().url().optional(),
  original_language: z.string().optional(),
  publisher: z.string().optional(),
  year_published: z.date(),
}).refine(data => data.finished_at >= data.started_at, {
  message: 'Finish date must be after or the same as start date',
  path: ['finishedAt'],
});

const languages = listOfLanguages.map(language => ({
  label: language.label,
  value: language.value,
}));

export default function AddNewBookModal() {
  const { session, user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  const userId = user?.id || session?.user?.id;

  const [image, setImage] = useState<ImagePicker.ImagePickerResult | null>(null);
  const [titleValue, setTitleValue] = useState('');
  const [authorValue, setAuthorValue] = useState('');
  const [originalLanguage, setOriginalLanguage] = useState('');
  const [publisher, setPublisher] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [finishDate, setFinishDate] = useState(new Date());
  const [yearPublished, setYearPublished] = useState(new Date());
  const [isValidDates, setIsValidDates] = useState(true);
  const [isFinishDateFuture, setIsFinishDateFuture] = useState(false);
  const [isPublishDateFuture, setIsPublishDateFuture] = useState(false);
  const [rating, setRating] = useState(null);
  const [ratingKey, setRatingKey] = useState(0);
  const [isAddingBook, setIsAddingBook] = useState(false);

  const [status, requestPermission] = ImagePicker.useCameraPermissions();

  const form = useForm<z.infer<typeof bookSchema>>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: '',
      author: '',
      comment_section: '',
      started_at: new Date(),
      finished_at: new Date(),
      rating: 0,
      photo_url: '',
      original_language: '',
      publisher: '',
      year_published: new Date(),
    },
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const { control, formState: { errors }, reset } = form;

  const getTodayDate = () => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const isDateInFuture = (date: Date) => {
    const today = getTodayDate();
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return compareDate > today;
  };

  const validateDates = (start: Date, finish: Date) => {
    const isValidOrder = finish >= start;
    const isFinishFuture = isDateInFuture(finish);

    setIsValidDates(isValidOrder);
    setIsFinishDateFuture(isFinishFuture);

    return isValidOrder && !isFinishFuture;
  };

  const validatePublishDate = (date: Date) => {
    const isFuture = isDateInFuture(date);
    setIsPublishDateFuture(isFuture);
    return !isFuture;
  };

  const isFormValid = titleValue.trim() !== '' &&
    authorValue.trim() !== '' &&
    isValidDates &&
    !isFinishDateFuture &&
    !isPublishDateFuture;

  const pickImage = async () => {
    if (!status?.granted) {
      const permissionResult = await requestPermission();
      if (!permissionResult.granted) {
        Alert.alert("Permission required", "Camera access is needed to take pictures");
        return;
      }
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0,
    });

    if (!result.canceled) {
      setImage(result);
    }
  };

  const handleAddBook = async () => {
    if (!isFormValid) return;

    setIsAddingBook(true);
    try {
      if (image && image.assets && image.assets[0]) {
        const uri = image.assets[0].uri;
        const fileName = uri.split('/').pop();

        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const { data, error } = await supabase.storage
          .from('bookbucket')
          .upload(`public/${fileName}`, decode(base64), {
            contentType: 'image/jpeg',
            cacheControl: '3600',
          });

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
          .from('bookbucket')
          .getPublicUrl(`public/${fileName}`);

        form.setValue('photo_url', publicUrlData.publicUrl);
      }

      const bookData = form.getValues();
      await addNewBook(userId!, bookData as Book);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["last-ten-books"] }),
        queryClient.invalidateQueries({ queryKey: ["books-data"] }),
      ]);

      Alert.alert('Awesome!', 'Your book has been added to the library!', [
        {
          text: 'OK',
          onPress: () => {
            reset();

            setTitleValue('');
            setAuthorValue('');
            setImage(null);
            setStartDate(new Date());
            setFinishDate(new Date());
            setOriginalLanguage('');
            setPublisher('');
            setYearPublished(new Date());
            setIsFinishDateFuture(false);
            setIsPublishDateFuture(false);
            setRating(null);
            setRatingKey(prev => prev + 1);
            router.back();
          }
        }
      ]);

    } catch (error) {
      Alert.alert('Oops!', 'Could not add your book. Please try again!');
    } finally {
      setIsAddingBook(false);
    }
  };

  if (isAddingBook) {
    return (
      <RotatingLoader
        message="Adding to your Library"
        subMessage="Almost there..."
        fullScreen={true}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Card */}
          <View style={styles.headerCard}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>New Book</Text>
              <Text style={styles.subtitle}>Add to your reading library</Text>
            </View>
            {/* Decorative Spots */}
            <View style={[styles.headerSpot, styles.spotTopRight]} />
            <View style={[styles.headerSpot, styles.spotBottomLeft]} />
          </View>

          {/* Essential Information */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <IconSymbol name="book.fill" size={16} color="#FF6B8B" />
              </View>
              <Text style={styles.sectionTitle}>Book Details</Text>
            </View>

            <Controller
              control={control}
              name="title"
              rules={{ required: true }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Title *</Text>
                  <TextInput
                    style={[styles.input, errors.title && styles.inputError]}
                    placeholder="What's the book called?"
                    placeholderTextColor="#C4B5A0"
                    value={value}
                    onChangeText={(text) => {
                      onChange(text);
                      setTitleValue(text);
                    }}
                    onBlur={onBlur}
                  />
                  {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}
                </View>
              )}
            />

            <Controller
              control={control}
              name="author"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Author *</Text>
                  <TextInput
                    style={[styles.input, errors.author && styles.inputError]}
                    placeholder="Who wrote it?"
                    placeholderTextColor="#C4B5A0"
                    value={value}
                    onChangeText={(text) => {
                      onChange(text);
                      setAuthorValue(text);
                    }}
                    onBlur={onBlur}
                  />
                  {errors.author && <Text style={styles.errorText}>{errors.author.message}</Text>}
                </View>
              )}
            />

            <Controller
              control={control}
              name="publisher"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Publisher</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Who published it?"
                    placeholderTextColor="#C4B5A0"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                </View>
              )}
            />
          </View>

          {/* Book Cover */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <IconSymbol name="camera.fill" size={16} color="#FF6B8B" />
              </View>
              <Text style={styles.sectionTitle}>Book Cover</Text>
            </View>

            <Controller
              control={control}
              name="photo_url"
              render={() => (
                <TouchableOpacity onPress={pickImage} style={styles.imageUploadContainer}>
                  {image?.assets && image.assets[0] ? (
                    <View style={styles.imagePreviewWrapper}>
                      <Image
                        source={{ uri: image.assets[0].uri }}
                        style={styles.imagePreview}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        onPress={() => setImage(null)}
                        style={styles.removeImageButton}
                      >
                        <IconSymbol name='xmark.circle.fill' size={24} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.uploadPlaceholder}>
                      <View style={styles.uploadIconWrapper}>
                        <IconSymbol name="camera.fill" size={32} color="#FF6B8B" />
                        <View style={styles.uploadSpot} />
                      </View>
                      <Text style={styles.uploadText}>Tap to add cover</Text>
                      <Text style={styles.uploadSubtext}>Show off your book!</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Reading Timeline */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <IconSymbol name="calendar" size={16} color="#FF6B8B" />
              </View>
              <Text style={styles.sectionTitle}>Reading Timeline</Text>
            </View>

            <View style={styles.dateRow}>
              <Controller
                control={control}
                name="started_at"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.dateContainer}>
                    <Text style={styles.inputLabel}>Started</Text>
                    <View style={styles.datePickerBox}>
                      <DateTimePicker
                        value={value as Date}
                        mode="date"
                        display="default"
                        onChange={(_, selectedDate) => {
                          const currentDate = selectedDate || value;
                          setStartDate(currentDate);
                          onChange(currentDate);
                          validateDates(currentDate, finishDate);
                        }}
                        style={styles.datePicker}
                      />
                    </View>
                  </View>
                )}
              />

              <Controller
                control={control}
                name="finished_at"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.dateContainer}>
                    <Text style={styles.inputLabel}>Finished</Text>
                    <View style={styles.datePickerBox}>
                      <DateTimePicker
                        value={value}
                        mode="date"
                        display="default"
                        onChange={(_, selectedDate) => {
                          const currentDate = selectedDate || value;
                          setFinishDate(currentDate);
                          onChange(currentDate);
                          validateDates(startDate, currentDate);
                        }}
                        style={styles.datePicker}
                      />
                    </View>
                  </View>
                )}
              />
            </View>

            {(!isValidDates || isFinishDateFuture) && (
              <View style={styles.dateErrorContainer}>
                <Text style={styles.errorText}>
                  {!isValidDates ? 'Finish date must be after start date' : 'Finish date cannot be in the future'}
                </Text>
              </View>
            )}
          </View>

          {/* Additional Info */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <IconSymbol name="info.circle.fill" size={16} color="#FF6B8B" />
              </View>
              <Text style={styles.sectionTitle}>Extra Details</Text>
            </View>

            <View style={styles.rowContainer}>
              <Controller
                control={control}
                name="original_language"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.halfWidth}>
                    <Text style={styles.inputLabel}>Language</Text>
                    <View style={styles.pickerContainer}>
                      <RNPickerSelect
                        value={value}
                        placeholder={{
                          label: 'Select',
                          value: null
                        }}
                        onValueChange={(selectedValue) => {
                          if (selectedValue !== null) {
                            onChange(selectedValue);
                            setOriginalLanguage(selectedValue);
                          }
                        }}
                        items={languages}
                        useNativeAndroidPickerStyle={false}
                        style={{
                          inputIOS: styles.pickerInput,
                          inputAndroid: styles.pickerInput,
                          placeholder: styles.pickerPlaceholder,
                        }}
                        Icon={() => {
                          return <View style={{ width: 120, height: 30, bottom: 6 }} />;
                        }}
                      />
                    </View>
                  </View>
                )}
              />

              <Controller
                control={control}
                name="year_published"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.halfWidth}>
                    <Text style={styles.inputLabel}>Year Published</Text>
                    <View style={styles.datePickerWrapper}>
                      <DateTimePicker
                        value={value as Date}
                        mode="date"
                        display="default"
                        onChange={(_, selectedDate) => {
                          const currentDate = selectedDate || value;
                          setYearPublished(currentDate);
                          onChange(currentDate);
                          validatePublishDate(currentDate);
                        }}
                        style={styles.datePicker}
                      />
                    </View>
                    {isPublishDateFuture && (
                      <Text style={styles.warningText}>Future date</Text>
                    )}
                  </View>
                )}
              />
            </View>
          </View>

          {/* Rating */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <IconSymbol name="heart.fill" size={16} color="#FF6B8B" />
              </View>
              <Text style={styles.sectionTitle}>Your Rating</Text>
            </View>

            <Controller
              control={control}
              name="rating"
              render={({ field: { onChange } }) => (
                <View style={styles.ratingWrapper}>
                  <StarRating
                    key={ratingKey}
                    rating={0}
                    size={38}
                    readonly={false}
                    onRatingChange={onChange}
                  />
                  {rating && (
                    <Text style={styles.ratingText}>{rating} stars out of 5</Text>
                  )}
                </View>
              )}
            />
          </View>

          {/* Thoughts */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <IconSymbol name="bubble.left.fill" size={16} color="#FF6B8B" />
              </View>
              <Text style={styles.sectionTitle}>Your Thoughts</Text>
            </View>

            <Controller
              control={control}
              name="comment_section"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.thoughtsInput}
                  placeholder="How did this book make you feel? Any favorite quotes or moments?"
                  placeholderTextColor="#C4B5A0"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
              )}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              !isFormValid && styles.submitButtonDisabled
            ]}
            onPress={handleAddBook}
            disabled={!isFormValid || isAddingBook}
          >
            <Text style={styles.submitButtonText}>Add to My Library</Text>
            {isFormValid && (
              <View style={styles.buttonSpot} />
            )}
          </TouchableOpacity>

          <Text style={styles.helperText}>* Required fields</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8F3',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF8F3',
  },
  contentContainer: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF8F3",
  },
  loadingContent: {
    alignItems: "center",
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF6B8B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
    position: "relative",
  },
  cowSpot1: {
    position: "absolute",
    width: 20,
    height: 15,
    backgroundColor: "#2D3436",
    borderRadius: 10,
    top: 10,
    left: 15,
    opacity: 0.1,
  },
  cowSpot2: {
    position: "absolute",
    width: 15,
    height: 12,
    backgroundColor: "#2D3436",
    borderRadius: 8,
    bottom: 12,
    right: 18,
    opacity: 0.1,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2D3436",
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: "#8B7355",
  },
  headerCard: {
    backgroundColor: "#FF6B8B",
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#FF6B8B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  headerContent: {
    zIndex: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFE5EC',
    fontWeight: '500',
  },
  headerSpot: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 50,
  },
  spotTopRight: {
    width: 60,
    height: 60,
    top: -15,
    right: 20,
  },
  spotBottomLeft: {
    width: 40,
    height: 40,
    bottom: -10,
    left: 30,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F5E6D3',
    shadowColor: "#8B7355",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE5EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B7355',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF8F3',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F5E6D3',
    padding: 14,
    fontSize: 16,
    color: '#2D3436',
  },
  inputError: {
    borderColor: '#FF6B8B',
    backgroundColor: '#FFF5F7',
  },
  errorText: {
    color: '#FF6B8B',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  warningText: {
    color: '#FFA500',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  imageUploadContainer: {
    width: '100%',
    height: 180,
  },
  uploadPlaceholder: {
    flex: 1,
    backgroundColor: '#FFF8F3',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFE5EC',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadIconWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  uploadSpot: {
    position: 'absolute',
    width: 12,
    height: 10,
    borderRadius: 6,
    opacity: 0.2,
    top: -4,
    right: -8,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#8B7355',
  },
  imagePreviewWrapper: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateContainer: {
    flex: 1,
  },
  datePickerBox: {
    justifyContent: 'flex-start',
    alignContent: 'flex-start',
  },
  datePicker: {
    height: 36,
  },
  dateErrorContainer: {
    marginTop: 8,
    backgroundColor: '#FFF5F7',
    padding: 8,
    borderRadius: 8,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  pickerContainer: {
    backgroundColor: '#FFF8F3',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F5E6D3',
  },
  pickerInput: {
    fontSize: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    color: '#2D3436',
  },
  pickerPlaceholder: {
    color: '#C4B5A0',
  },
  datePickerWrapper: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  ratingWrapper: {
    alignItems: 'center',
  },
  ratingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8B7355',
    fontWeight: '500',
  },
  thoughtsInput: {
    backgroundColor: '#FFF8F3',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F5E6D3',
    padding: 14,
    fontSize: 16,
    color: '#2D3436',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#FF6B8B',
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
    shadowColor: '#FF6B8B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    backgroundColor: '#D4C5B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonSpot: {
    position: 'absolute',
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    top: -10,
    right: 30,
  },
  helperText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#8B7355',
    marginBottom: 20,
  },
});