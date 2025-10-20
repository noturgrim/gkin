import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "../../context/TranslationContext";
import authService from "../../services/authService";
import { toast } from "react-hot-toast";
import { WeekSelector } from "../week-selector";
import { TranslationForm } from "./translation-form";
import { LyricsCard } from "./lyrics-card";
import { LyricsInputModal } from "../lyrics-input-modal";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import {
  Loader2,
  Globe,
  Music,
  Check,
  AlertCircle,
  Plus,
  ArrowLeft,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export function LyricsTranslationPage() {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [selectedWeek, setSelectedWeek] = useState(null);
  const {
    lyrics,
    loading,
    error,
    currentServiceDate,
    fetchAllLyrics,
    fetchLyricsByDate,
    submitLyrics,
  } = useTranslation();

  // Get query parameters from URL
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get("tab");

  const [selectedLyric, setSelectedLyric] = useState(null);
  const [activeTab, setActiveTab] = useState(
    tabParam === "translated" ? "translated" : "pending"
  );
  const [isLyricsModalOpen, setIsLyricsModalOpen] = useState(false);
  const [isSubmittingLyrics, setIsSubmittingLyrics] = useState(false);

  // Add console log to debug lyrics data
  console.log("Current lyrics data:", {
    lyrics,
    currentServiceDate,
    selectedWeek,
  });

  // Calculate counts for each tab
  const pendingLyrics = (lyrics || []).filter(
    (lyric) => !lyric.translation || lyric.translation.status === "pending"
  );

  const translatedLyrics = (lyrics || []).filter(
    (lyric) =>
      lyric.translation &&
      (lyric.translation.status === "completed" ||
        lyric.translation.status === "approved")
  );

  // Filter lyrics based on active tab
  const filteredLyrics =
    activeTab === "pending" ? pendingLyrics : translatedLyrics;

  // Handle date change
  const handleDateChange = (dateString) => {
    setSelectedWeek(dateString);
    if (dateString) {
      fetchLyricsByDate(dateString);
    } else {
      fetchAllLyrics();
    }
  };

  // Handle lyric selection
  const handleSelectLyric = (lyric) => {
    setSelectedLyric(lyric);
  };

  // Handle translation form close
  const handleCloseForm = () => {
    setSelectedLyric(null);
  };

  // Handle opening lyrics modal
  const handleOpenLyricsModal = () => {
    setIsLyricsModalOpen(true);
  };

  // Handle lyrics modal close
  const handleCloseLyricsModal = () => {
    setIsLyricsModalOpen(false);
  };

  // Handle lyrics submission
  const handleLyricsSubmit = (lyricsData) => {
    if (!selectedWeek) {
      toast.error("Please select a date first");
      return;
    }

    console.log("Submitting lyrics for date:", selectedWeek, lyricsData.songs);
    setIsSubmittingLyrics(true);
    submitLyrics(selectedWeek, lyricsData.songs)
      .then((response) => {
        console.log("Lyrics submission response:", response);
        setIsLyricsModalOpen(false);
        toast.success("Lyrics added successfully!");

        // Force refresh lyrics for the selected date
        fetchLyricsByDate(selectedWeek);
      })
      .catch((error) => {
        console.error("Error submitting lyrics:", error);
        toast.error("Failed to add lyrics. Please try again.");
      })
      .finally(() => {
        setIsSubmittingLyrics(false);
      });
  };

  // Determine if user can translate (translator role)
  const canTranslate =
    user && (user.role === "translator" || user.role === "admin");

  // Create a ref to track initial fetch
  const initialFetchDone = useRef(false);

  // Fetch lyrics on component mount - only once
  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchAllLyrics();
      initialFetchDone.current = true;
    }
  }, [fetchAllLyrics]);

  // Add an effect to monitor selectedWeek changes
  useEffect(() => {
    if (selectedWeek) {
      console.log("Selected week changed, fetching lyrics for:", selectedWeek);
      fetchLyricsByDate(selectedWeek);
    }
  }, [selectedWeek, fetchLyricsByDate]);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Back to Dashboard Button */}
      <div className="mb-4">
        <Link to="/dashboard">
          <Button
            variant="ghost"
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 mb-2">
            <Globe className="h-6 w-6 text-blue-600" />
            Lyrics Translation
          </h1>
          <p className="text-gray-600">
            Translate song lyrics for upcoming services
          </p>
        </div>

        <div className="mt-4 md:mt-0 w-full md:w-auto">
          <WeekSelector
            selectedWeek={selectedWeek}
            onWeekChange={handleDateChange}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Lyrics list */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4">
            <Tabs
              defaultValue="pending"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <div className="flex flex-col space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Song Lyrics</h2>
                  <TabsList className="grid grid-cols-2 h-8">
                    <TabsTrigger value="pending" className="text-xs">
                      Pending
                      <Badge variant="secondary" className="ml-2">
                        {pendingLyrics.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="translated" className="text-xs">
                      Translated
                      <Badge variant="secondary" className="ml-2">
                        {translatedLyrics.length}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>
                </div>

                {canTranslate && (
                  <Button
                    onClick={handleOpenLyricsModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full flex items-center justify-center gap-1"
                    size="sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Song Lyrics
                  </Button>
                )}
              </div>

              <TabsContent value="pending" className="mt-0">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                  </div>
                ) : filteredLyrics.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Music className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p>No pending lyrics found</p>
                    {!currentServiceDate ? (
                      <p className="text-sm mt-2">
                        Select a specific date to see service lyrics
                      </p>
                    ) : (
                      <p className="text-sm mt-2">
                        No lyrics have been added for this date yet
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {filteredLyrics.map((lyric) => (
                      <LyricsCard
                        key={lyric.id}
                        lyric={lyric}
                        isSelected={selectedLyric?.id === lyric.id}
                        onClick={() => handleSelectLyric(lyric)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="translated" className="mt-0">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                  </div>
                ) : filteredLyrics.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Globe className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p>No translated lyrics found</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {filteredLyrics.map((lyric) => (
                      <LyricsCard
                        key={lyric.id}
                        lyric={lyric}
                        isSelected={selectedLyric?.id === lyric.id}
                        onClick={() => handleSelectLyric(lyric)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Approved tab removed as per user request */}
            </Tabs>
          </div>
        </div>

        {/* Right column - Translation form or details */}
        <div className="lg:col-span-2">
          {selectedLyric ? (
            <TranslationForm
              lyric={selectedLyric}
              onClose={handleCloseForm}
              canTranslate={canTranslate}
            />
          ) : (lyrics || []).length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 h-full flex flex-col items-center justify-center text-center">
              <Music className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">
                No lyrics available for translation
              </h3>
              <p className="text-gray-500 max-w-md mb-6">
                {!currentServiceDate
                  ? "Select a date from the calendar above to see if there are any lyrics for that service."
                  : "There are no lyrics added for this service date yet."}
              </p>
              {canTranslate && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleOpenLyricsModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Song Lyrics
                  </Button>
                  <Button
                    onClick={() => (window.location.href = "/dashboard")}
                    variant="outline"
                    className="border-gray-300"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 h-full flex flex-col items-center justify-center text-center">
              <Globe className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">
                Select a song to translate
              </h3>
              <p className="text-gray-500 max-w-md">
                Click on a song from the list to view details and add or edit
                translations
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lyrics Input Modal */}
      <LyricsInputModal
        isOpen={isLyricsModalOpen}
        onClose={handleCloseLyricsModal}
        onSubmit={handleLyricsSubmit}
        initialData={null}
        isSubmitting={isSubmittingLyrics}
      />
    </div>
  );
}
