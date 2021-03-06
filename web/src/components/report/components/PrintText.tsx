import { StyleSheet, Text, View } from '@react-pdf/renderer';
import React from 'react';

import { usePrinterStyles } from '../usePrinterStyles';

interface PrintTextProps {
  children: React.ReactNode;
  align?: 'center' | 'left' | 'right' | 'justify';
}

export const PrintText = (props: PrintTextProps) => {
  const { children, align } = props;
  const { config } = usePrinterStyles();

  const classes = StyleSheet.create({
    wrapper: { marginHorizontal: 15 },
    text: {
      ...config.main,
      lineHeight: 1.25,
      textAlign: align ?? 'justify',
    },
  });

  return (
    <View style={[classes.wrapper]}>
      <Text style={[classes.text]}>{children}</Text>
    </View>
  );
};
