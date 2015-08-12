/**Author: Cooper Sloan for DataParenting
 * Date: 12 August 2015
 * About: This class pulls standard milestones and custom achievements from parse, and looks for
 * matches and patterns, saving new object back into Parse in the Similarities class
 */
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLEncoder;
import java.net.HttpURLConnection;
import java.net.URLConnection;
import semantics.Compare;
import org.json.*;
import java.io.*;

public class MilestoneSimilarity {
	public static JSONArray standardMilestones;
	public static JSONArray customMilestones;
	public static int numSaved=0;
	
	public static double getSimilarity(String sentence1,String sentence2){
		Compare c= new Compare(sentence1,sentence2);
		return c.getResult();
	}
	
	public static void print(Object name){
		System.out.println(name);
	}
	
	public static void getStandardMilestones() throws JSONException{
		print("Getting standard milestones...");
		String url = "https://api.parse.com/1/classes/StandardMilestones";
		String charset = java.nio.charset.StandardCharsets.UTF_8.name();
		String limit = "1000";
		String keys = "title";
		String query="";
		try {
			query = String.format("limit=%s&keys=%s", 
			     URLEncoder.encode(limit, charset), 
			     URLEncoder.encode(keys, charset));
		} catch (UnsupportedEncodingException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
		}
		URLConnection connection;
		try {
			connection = new URL(url + "?" + query).openConnection();
			connection.setRequestProperty("Accept-Charset", charset);
			connection.setRequestProperty("X-Parse-Application-Id", "NlJHBG0NZgFS8JP76DBjA31MBRZ7kmb7dVSQQz3U");
			connection.setRequestProperty("X-Parse-Master-Key","ScHR4mshg3TICZKsbPiLmCFLEidiChAwLpWHIUCO");
			InputStream response = connection.getInputStream();
			BufferedReader r = new BufferedReader(new InputStreamReader(response));
			StringBuilder total = new StringBuilder();
			String line;
			while ((line = r.readLine()) != null) {
			    total.append(line);
			}
			JSONObject obj = new JSONObject(total.toString());
			JSONArray results = obj.getJSONArray("results");
			standardMilestones(results);
			getCustomMilestones();
		} catch (MalformedURLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	public static void getCustomMilestones() throws JSONException{
		print("Getting custom milestones...");
		String url = "https://api.parse.com/1/classes/MilestoneAchievements";
		String charset = java.nio.charset.StandardCharsets.UTF_8.name();
		String limit = "1000";
		String order = "customTitle";
		String keys = "customTitle";
		String where = "{\"customTitle\":{\"$exists\":true},\"standardMilestoneId\":{\"$exists\":false},\"customTitle\":{\"$regex\":\"^(?!\\\\$).+\"}}";
		
		String query="";
		try {
			query = String.format("limit=%s&order=%s&keys=%s&where=%s", 
			     URLEncoder.encode(limit, charset), 
			     URLEncoder.encode(order, charset), 
			     URLEncoder.encode(keys, charset),
			     URLEncoder.encode(where, charset));
		} catch (UnsupportedEncodingException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
		}
		URLConnection connection;
		try {
			connection = new URL(url + "?" + query).openConnection();
			connection.setRequestProperty("Accept-Charset", charset);
			connection.setRequestProperty("X-Parse-Application-Id", "NlJHBG0NZgFS8JP76DBjA31MBRZ7kmb7dVSQQz3U");
			connection.setRequestProperty("X-Parse-Master-Key","ScHR4mshg3TICZKsbPiLmCFLEidiChAwLpWHIUCO");
			InputStream response = connection.getInputStream();
			BufferedReader r = new BufferedReader(new InputStreamReader(response));
			StringBuilder total = new StringBuilder();
			String line;
			while ((line = r.readLine()) != null) {
			    total.append(line);
			}
			JSONObject obj = new JSONObject(total.toString());
			JSONArray results = obj.getJSONArray("results");
			customMilestones(results);
			compareWithStandard(results);
		} catch (MalformedURLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
	}
	
	public static void compareWithStandard(JSONArray customMilestoneList) throws JSONException{
		print("Comparing custom achievements to standard milestones");
		int numProcessed=0;
		for (int i = 0; i < customMilestoneList.length(); i++) {
			getMostSimilarToMilestone(customMilestoneList.getJSONObject(i));
			print("Processing number: "+ ++numProcessed);
			}
		compareAllMilestones(customMilestones());
	}
	
	public static void standardMilestones(JSONArray list){
		standardMilestones=list;
	}
	
	public static JSONArray standardMilestones(){
		return standardMilestones;
	}
	
	public static void customMilestones(JSONArray list){
		customMilestones=list;
	}
	
	public static JSONArray customMilestones(){
		return customMilestones;
	}
	
	public static void getMostSimilarToMilestone(JSONObject customMilestone) throws JSONException{
		String customTitle=(String)customMilestone.getString("customTitle");
		JSONArray standardMilestones=standardMilestones();
		for(int i=0; i<standardMilestones().length(); i++){
			JSONObject standardMilestone = standardMilestones.getJSONObject(i);
			String standardTitle=standardMilestone.getString("title");
			double sim=getSimilarity(customTitle,standardTitle);
			if(sim>0.87){
				if(sim>0.999999999999){sim=1.0;}
				saveSimilarityObject(standardMilestone,customMilestone,sim);
			}
		}
	}
	
	public static void saveSimilarityObject(JSONObject standardMilestone, JSONObject customMilestone, double sim) throws JSONException{
		String title1=customMilestone.getString("customTitle");
		String customMilestoneId=customMilestone.getString("objectId");
		String title2=standardMilestone.getString("title");
		String standardMilestoneId=standardMilestone.getString("objectId");
		String url = "https://api.parse.com/1/classes/Similarities";
	    
	    HttpURLConnection con = null;
	    try {
	    	URL obj = new URL(url);
	        con = (HttpURLConnection) obj.openConnection();
	    } catch (IOException e) {
	        print("Failed to connect to http link");
	        e.printStackTrace();
	    }

	    //add request header
	    try {
	        con.setRequestMethod("POST");
	    } catch (IOException e) {
	        print("Failed to set to POST");
	        e.printStackTrace();
	    }
		con.setRequestProperty("X-Parse-Application-Id", "NlJHBG0NZgFS8JP76DBjA31MBRZ7kmb7dVSQQz3U");
		con.setRequestProperty("X-Parse-Master-Key","ScHR4mshg3TICZKsbPiLmCFLEidiChAwLpWHIUCO");
	    con.setRequestProperty("Content-Type", "application/json");

	    JSONObject standardMilestonePointer = new JSONObject();
	    standardMilestonePointer.put("__type", "Pointer");
	    standardMilestonePointer.put("className", "StandardMilestones");
	    standardMilestonePointer.put("objectId", standardMilestoneId);
	    
	    JSONObject customMilestonePointer = new JSONObject();
	    customMilestonePointer.put("__type", "Pointer");
	    customMilestonePointer.put("className", "MilestoneAchievements");
	    customMilestonePointer.put("objectId", customMilestoneId);
	    
	    JSONObject similarityObject = new JSONObject();
	    similarityObject.put("title1",title1);
	    similarityObject.put("title2",title2);
	    similarityObject.put("similarityScore",sim);
	    similarityObject.put("achievement1",customMilestonePointer);
	    similarityObject.put("standardMilestone",standardMilestonePointer);

	    String urlParameters = similarityObject.toString();

	    // Send POST request
	    con.setDoOutput(true);
	    DataOutputStream wr = null;
	    try {
	        wr = new DataOutputStream(con.getOutputStream());
	    } catch (IOException e1) {
	        print("Failed to get output stream");
	        e1.printStackTrace();
	    }
	    try {
	        wr.writeBytes(urlParameters);
	    } catch (IOException e) {
	        print("Failed to connect to send over Parse object as parameter");
	        e.printStackTrace();
	    }
	    try {
	        wr.flush();
	    } catch (IOException e) {
	        e.printStackTrace();
	    }
	    try {
	        wr.close();
	    } catch (IOException e) {
	        print("Failed to connect to close datastream connection");
	        e.printStackTrace();
	    }

	    int responseCode = 0;
	    try {
	        responseCode = con.getResponseCode();
	    } catch (IOException e) {
	        print("Failed to connect to get response code");
	        e.printStackTrace();
	    }
	    if(responseCode==201){print("Successfully saved");}
	    else{print("Response Code : " + responseCode);}
	    con.disconnect();
        print("**********Saved number : "+ ++numSaved+"********** With similarity of: "+sim);
        print(title1+"------"+title2);
	}
	
	public static void saveSimilarityObject(JSONObject customMilestone1, JSONObject customMilestone2, double sim, boolean bothCustom) throws JSONException{
		String title1=customMilestone1.getString("customTitle");
		String customMilestoneId1=customMilestone1.getString("objectId");
		String title2=customMilestone2.getString("customTitle");
		String customMilestoneId2=customMilestone2.getString("objectId");
		String url = "https://api.parse.com/1/classes/Similarities";
	    
	    HttpURLConnection con = null;
	    try {
	    	URL obj = new URL(url);
	        con = (HttpURLConnection) obj.openConnection();
	    } catch (IOException e) {
	        print("Failed to connect to http link");
	        e.printStackTrace();
	    }

	    //add request header
	    try {
	        con.setRequestMethod("POST");
	    } catch (IOException e) {
	        print("Failed to set to POST");
	        e.printStackTrace();
	    }
		con.setRequestProperty("X-Parse-Application-Id", "NlJHBG0NZgFS8JP76DBjA31MBRZ7kmb7dVSQQz3U");
		con.setRequestProperty("X-Parse-Master-Key","ScHR4mshg3TICZKsbPiLmCFLEidiChAwLpWHIUCO");
	    con.setRequestProperty("Content-Type", "application/json");

	    JSONObject customMilestonePointer1 = new JSONObject();
	    customMilestonePointer1.put("__type", "Pointer");
	    customMilestonePointer1.put("className", "MilestoneAchievements");
	    customMilestonePointer1.put("objectId", customMilestoneId1);
	    
	    JSONObject customMilestonePointer2 = new JSONObject();
	    customMilestonePointer2.put("__type", "Pointer");
	    customMilestonePointer2.put("className", "MilestoneAchievements");
	    customMilestonePointer2.put("objectId", customMilestoneId2);
	    
	    JSONObject similarityObject = new JSONObject();
	    similarityObject.put("title1",title1);
	    similarityObject.put("title2",title2);
	    similarityObject.put("similarityScore",sim);
	    similarityObject.put("achievement1",customMilestonePointer1);
	    similarityObject.put("achievement2",customMilestonePointer2);

	    String urlParameters = similarityObject.toString();

	    // Send POST request
	    con.setDoOutput(true);
	    DataOutputStream wr = null;
	    try {
	        wr = new DataOutputStream(con.getOutputStream());
	    } catch (IOException e1) {
	        print("Failed to get output stream");
	        e1.printStackTrace();
	    }
	    try {
	        wr.writeBytes(urlParameters);
	    } catch (IOException e) {
	        print("Failed to connect to send over Parse object as parameter");
	        e.printStackTrace();
	    }
	    try {
	        wr.flush();
	    } catch (IOException e) {
	        e.printStackTrace();
	    }
	    try {
	        wr.close();
	    } catch (IOException e) {
	        print("Failed to connect to close datastream connection");
	        e.printStackTrace();
	    }

	    int responseCode = 0;
	    try {
	        responseCode = con.getResponseCode();
	    } catch (IOException e) {
	        print("Failed to connect to get response code");
	        e.printStackTrace();
	    }
	    if(responseCode==201){print("Successfully saved");}
	    else{print("Response Code : " + responseCode);}
	    con.disconnect();
        print("**********Saved number : "+ ++numSaved+"********** With similarity of: "+sim);
        print(title1+"------"+title2);
	}
	
	public static void compareAllMilestones(JSONArray listOfAchievements) throws JSONException{
		print("Comparing custom milestones with eachother");
		int num=0;
		JSONArray cloneOfAchievements=new JSONArray(listOfAchievements.toString());
		for(int i=0; i<listOfAchievements.length();i++){
			print("Processing number: "+ ++num);
			for(int j=0; j<cloneOfAchievements.length();j++){
				if(i!=j){
					JSONObject achievement1=listOfAchievements.getJSONObject(i);
					JSONObject achievement2=listOfAchievements.getJSONObject(j);
					String title1=achievement1.getString("customTitle");
					String title2=achievement2.getString("customTitle");
					double sim=getSimilarity(title1,title2);
					if(sim>0.87){
						if(sim>0.999999999999){sim=1.0;}
						saveSimilarityObject(achievement1,achievement2,sim, true);
					}
				}
			}
			cloneOfAchievements.remove(0);
		}
		print("Script complete!");
	}
	
	public static void main(String[] args) {
		try {
			getStandardMilestones();
		} catch (JSONException e) {
			print("Failed in the runway");
			e.printStackTrace();
		}
		
	}
}
