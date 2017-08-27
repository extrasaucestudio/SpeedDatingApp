import React, { Component } from 'react';
import {
  Button,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions
} from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import { defaultStyles } from '../styles';
import { put, get } from '../../components/api';
const { width,height } = Dimensions.get('window')

export default class WorkModal extends Component {
  
  constructor(props) {
    super(props);
    const { user } = this.props.navigation.state.params;
    this.state = {
      work: user.work
    }
  }
    
  saveUser = async () => {
    const { user } = this.props.navigation.state.params;
    user.work = this.state.work;
    try {
      const response = await put('user', {
        user: user
      }); 
      const json = await response.json(); 
      console.log( JSON.stringify(json) );
    }
    catch (error) {
      alert(error);
    }
  };

  render() {
    const { goBack } = this.props.navigation;
    const {user} = this.props.navigation.state.params;
    console.log(user.work);
    return (
      

      <View style={styles.container}>
        <View style={styles.navBar}>
          <Text style={styles.navBarButton}></Text>
          <Text style={styles.navBarHeader}>Текущая работа</Text>
          <TouchableOpacity onPress={() =>  {
            this.saveUser();
            this.props.navigation.navigate('Edit', { user: user });
          }}>
            <Text style={styles.navBarButton}>Готово</Text>
          </TouchableOpacity>
        </View>
       
        <ScrollView
          contentContainerStyle={styles.scrollContent}>
          

          <View style={styles.back}>
          

        
            <TouchableOpacity onPress={() =>  {
              this.setState({ 
                gender: 1
              })
            }}>
            <View style={styles.navBarTest}>
              <Text style={styles.item}> {user.work.position_name } at {user.work.employer_name} </Text>
              <Icon  style={ this.state.gender == 1 ? styles.colorfull : styles.transparent } name="ios-checkmark" size={35} />
            </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() =>  {
              this.setState({ 
                gender: 2
              })
            }}>
            <View style={styles.navBarTest}>
              <Text style={styles.item}>Нет</Text>
              <Icon  style={ this.state.gender == 2 ? styles.colorfull : styles.transparent } name="ios-checkmark" size={35} />
            </View>
            </TouchableOpacity>


          

  
          
        
          </View>
        </ScrollView>

      </View>
    );
  }
}
    

// <TouchableOpacity onPress={() =>  {
//   this.setState({ 
//     gender: 2
//   })
// }}>

// <View style={styles.navBarTest}>
//   <Text style={styles.item}>Мужчина</Text>
//   <Icon style={ this.state.gender == 2 ? styles.colorfull : styles.transparent } name="ios-checkmark" size={35} />
// </View>
// </TouchableOpacity>


{/* <TouchableOpacity onPress={() =>  {
  this.setState({ 
    gender: 1
  })
}}>
<View style={styles.navBarTest}>
  <Text style={styles.item}>Женщина</Text>
  <Icon  style={ this.state.gender == 1 ? styles.colorfull : styles.transparent } name="ios-checkmark" size={35} />
</View>


</TouchableOpacity> */}
 

const styles = StyleSheet.create({
  back: {
    marginTop: 30,
    backgroundColor: '#FFFFFF'
  },
  container: {
    flex: 1,
    // backgroundColor: '#FFF',
    // alignItems: 'center',
    // justifyContent: 'center',
  },
  transparent: {
    color: 'transparent'
  },
  colorfull: {
    color: '#3f88fb'
  },
  navBarTest: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: width - 20
  },
  navBar: {
    flexDirection: 'row',
    paddingTop: 30,
    height: 64,
    backgroundColor: '#FFFFFF' // '#1EAAF1'
  },
  

  navBarButton: {
    color: '#3f88fb',
    textAlign:'center',
    width: 64,
    fontSize: 15,
    fontWeight: 'bold'
  },
  navBarHeader: {
    flex: 1,
    color: '#262626',
    fontWeight: 'bold',
    textAlign: 'center',
    ...defaultStyles.text,
    fontSize: 15,
    // marginTop: 5
  },
  header: {
    fontSize: 20,
    marginVertical: 20,
  },

  sectionHeader: {
    // paddingTop: 2,
    // paddingLeft: 10,
    // paddingRight: 10,
    // paddingBottom: 2,
    // fontSize: 14,
    // fontWeight: 'bold',
    backgroundColor: 'rgba(247,247,247,1.0)',
  },
  item: {
    padding: 10,
    fontSize: 15,
    height: 44,
    fontFamily: 'System',
    textAlign:'center',
  },

});